/// <reference types="@types/google.maps" />
import { PointOfInterest } from "../types";

// Google Places API configuration
export const GOOGLE_API_KEY = "AIzaSyAzCHbNOtqBj7HAZ1-XJ0uXtmqtbvheW-c";

declare global {
  interface Window {
    google: typeof google;
  }
}

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
    return photos[0].getUrl();
  }

  // Fallback images
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop';
};

const getPlaceDetails = (placeId: string, service: google.maps.places.PlacesService): Promise<google.maps.places.PlaceResult> => {
  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: ['website', 'formatted_phone_number', 'url']
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      }
    );
  });
};

const transformGoogleToPointOfInterest = async (
  place: google.maps.places.PlaceResult,
  service: google.maps.places.PlacesService
): Promise<PointOfInterest> => {
  let details = {};
  try {
    if (place.place_id) {
      details = await getPlaceDetails(place.place_id, service);
    }
  } catch (error) {
    console.warn('Failed to fetch place details:', error);
  }

  const combinedPlace = { ...place, ...details };

  return {
    id: combinedPlace.place_id || '',
    name: combinedPlace.name || '',
    category: 'food', // We'll determine this based on types
    subcategory: combinedPlace.types?.[0]?.replace(/_/g, ' '),
    description: combinedPlace.vicinity || '',
    rating: combinedPlace.rating || 4.0,
    reviews: combinedPlace.user_ratings_total || 0,
    image: getPlaceImage(combinedPlace.photos),
    location: {
      latitude: combinedPlace.geometry?.location?.lat() || 0,
      longitude: combinedPlace.geometry?.location?.lng() || 0,
      address: combinedPlace.vicinity || ''
    },
    priceRange: combinedPlace.price_level as 1 | 2 | 3 | 4,
    openNow: combinedPlace.opening_hours?.isOpen(),
    tags: combinedPlace.types?.map(t => t.replace(/_/g, ' ')) || [],
    contact: {
      phone: combinedPlace.formatted_phone_number,
    },
    website: combinedPlace.website || combinedPlace.url // Fall back to Google Maps URL if no website
  };
};

export const fetchPlaces = async (params: GoogleSearchParams): Promise<PointOfInterest[]> => {
  await loadGoogleMapsApi();
  
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

    service.nearbySearch(request, async (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        try {
          const places = await Promise.all(
            results.map(result => transformGoogleToPointOfInterest(result, service))
          );
          resolve(places);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Google Places API error: ${status}`));
      }
    });
  });
}; 