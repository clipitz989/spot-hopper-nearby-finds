/// <reference types="@types/google.maps" />
import { PointOfInterest } from "../types";

// Google Places API configuration
export const GOOGLE_API_KEY = "AIzaSyAzCHbNOtqBj7HAZ1-XJ0uXtmqtbvheW-c";

declare global {
  interface Window {
    google: typeof google;
  }
}

// Create a cache to store place data by ID to maintain consistency
const placesCache = new Map<string, PointOfInterest>();

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
      console.error("Error getting place photo:", error);
    }
  }

  // Fallback images
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop';
};

const transformGoogleToPointOfInterest = (place: google.maps.places.PlaceResult): PointOfInterest => {
  // Check if we already have this place in the cache
  const placeId = place.place_id || '';
  if (placesCache.has(placeId)) {
    return placesCache.get(placeId)!;
  }
  
  // Otherwise create a new place object
  const poi: PointOfInterest = {
    id: placeId,
    name: place.name || '',
    category: 'food', // We'll determine this based on types
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
  
  // Store in cache for future use
  placesCache.set(placeId, poi);
  
  return poi;
};

export const fetchPlaces = async (params: GoogleSearchParams): Promise<PointOfInterest[]> => {
  await loadGoogleMapsApi();
  console.log("Fetching places for location:", params.location);
  
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const [lat, lng] = params.location.split(',').map(Number);
    
    const request = {
      location: new google.maps.LatLng(lat, lng),
      radius: params.radius || 10000,
      type: params.type,
      openNow: params.opennow,
      minPriceLevel: params.minprice,
      maxPriceLevel: params.maxprice
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        console.log(`Google API returned ${results.length} places`);
        resolve(results.map(transformGoogleToPointOfInterest));
      } else {
        console.error(`Google Places API error: ${status}`);
        reject(new Error(`Google Places API error: ${status}`));
      }
    });
  });
};
