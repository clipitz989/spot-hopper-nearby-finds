/// <reference types="@types/google.maps" />
import { PointOfInterest } from "../types";

// Google Places API configuration
export const GOOGLE_API_KEY = "AIzaSyAzCHbNOtqBj7HAZ1-XJ0uXtmqtbvheW-c";

declare global {
  interface Window {
    google: typeof google;
  }
}

let placesService: google.maps.places.PlacesService | null = null;
let mapElement: HTMLDivElement | null = null;

// Load Google Maps JavaScript API
const loadGoogleMapsApi = () => {
  if (typeof window !== 'undefined' && !window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return new Promise((resolve) => {
      script.onload = () => resolve(window.google);
    });
  }
  return Promise.resolve(window.google);
};

// Initialize the Places service with a proper map
const initPlacesService = () => {
  if (!mapElement) {
    mapElement = document.createElement('div');
    mapElement.style.display = 'none';
    document.body.appendChild(mapElement);
    
    const map = new google.maps.Map(mapElement, {
      center: { lat: 0, lng: 0 },
      zoom: 1
    });
    
    placesService = new google.maps.places.PlacesService(map);
  }
  return placesService;
};

// Category mappings to Google place types
const CATEGORY_MAPPING = {
  food: ["restaurant", "cafe", "bar", "bakery", "meal_takeaway"],
  attractions: ["tourist_attraction", "museum", "park", "art_gallery", "landmark"],
  activities: ["shopping_mall", "store", "gym", "spa", "amusement_park"]
};

export interface GoogleSearchParams {
  location: string; // latitude,longitude
  radius?: number; // in meters
  type?: string;
  keyword?: string;
  opennow?: boolean;
  minprice?: number;
  maxprice?: number;
}

// Convert our app categories to Google place types
export const mapCategoriesToGoogle = (categories: string[]): string[] => {
  if (!categories || categories.length === 0) {
    return [];
  }

  return categories.flatMap(category => 
    CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || []
  );
};

const getPlaceImage = (photos: google.maps.places.PlacePhoto[] | undefined): string => {
  if (photos && photos.length > 0) {
    try {
      return photos[0].getUrl();
    } catch (error) {
      console.error('Error getting place photo:', error);
    }
  }

  // Fallback images
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop';
};

const transformGoogleToPointOfInterest = (place: google.maps.places.PlaceResult): PointOfInterest => {
  let category: 'food' | 'attractions' | 'activities' = 'food';
  
  // Determine category based on place types
  if (place.types) {
    if (place.types.some(type => CATEGORY_MAPPING.food.includes(type))) {
      category = 'food';
    } else if (place.types.some(type => CATEGORY_MAPPING.attractions.includes(type))) {
      category = 'attractions';
    } else if (place.types.some(type => CATEGORY_MAPPING.activities.includes(type))) {
      category = 'activities';
    }
  }

  return {
    id: place.place_id || '',
    name: place.name || '',
    category,
    subcategory: place.types?.[0]?.replace(/_/g, ' '),
    description: place.vicinity || '',
    rating: place.rating || 4.0,
    reviews: place.user_ratings_total || 0,
    image: getPlaceImage(place.photos),
    location: {
      latitude: place.geometry?.location?.lat() || 0,
      longitude: place.geometry?.location?.lng() || 0,
      address: place.vicinity || ''
    },
    priceRange: place.price_level as 1 | 2 | 3 | 4,
    openNow: place.opening_hours?.isOpen(),
    tags: place.types?.map(t => t.replace(/_/g, ' ')) || [],
    contact: {}
  };
};

export const fetchPlaces = async (params: GoogleSearchParams): Promise<PointOfInterest[]> => {
  await loadGoogleMapsApi();
  
  return new Promise((resolve, reject) => {
    try {
      const service = initPlacesService();
      if (!service) {
        throw new Error('Failed to initialize Places service');
      }
      
      const [lat, lng] = params.location.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid location coordinates');
      }
      
      const request = {
        location: new google.maps.LatLng(lat, lng),
        radius: params.radius || 10000,
        type: params.type,
        openNow: params.opennow,
        minPriceLevel: params.minprice,
        maxPriceLevel: params.maxprice
      };

      console.log('Searching places with request:', request);
      
      service.nearbySearch(request, (results, status, pagination) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log('Found places:', results.length);
          resolve(results.map(transformGoogleToPointOfInterest));
        } else {
          console.error('Places API error:', status);
          reject(new Error(`Google Places API error: ${status}`));
        }
      });
    } catch (error) {
      console.error('Error in fetchPlaces:', error);
      reject(error);
    }
  });
}; 