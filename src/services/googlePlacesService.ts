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

// Function to clear cache when location changes
export const clearPlacesCache = () => {
  console.log("Clearing places cache");
  placesCache.clear();
};

// Load Google Maps JavaScript API
const loadGoogleMapsApi = () => {
  return new Promise<typeof google>((resolve, reject) => {
    if (typeof window !== 'undefined') {
      if (window.google) {
        console.log("Google Maps API already loaded");
        resolve(window.google);
        return;
      }
      
      // Check if the script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        console.log("Google Maps API script already exists, waiting for load");
        existingScript.addEventListener('load', () => resolve(window.google));
        return;
      }
      
      console.log("Loading Google Maps API script");
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps API script loaded successfully");
        resolve(window.google);
      };
      script.onerror = (error) => {
        console.error("Error loading Google Maps API script:", error);
        reject(new Error("Failed to load Google Maps API"));
      };
      document.head.appendChild(script);
    } else {
      reject(new Error("Window is not defined"));
    }
  });
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

const transformGoogleToPointOfInterest = (place: google.maps.places.PlaceResult, userLat: number, userLng: number): PointOfInterest => {
  // Check if we already have this place in the cache
  const placeId = place.place_id || '';
  if (placesCache.has(placeId)) {
    console.log(`Using cached data for place: ${placeId}`);
    return placesCache.get(placeId)!;
  }
  
  console.log(`Creating new place object for: ${place.name} (${placeId})`);
  
  const placeLat = place.geometry?.location?.lat() || 0;
  const placeLng = place.geometry?.location?.lng() || 0;
  
  // Calculate distance in meters using the Haversine formula
  const R = 6371e3; // Earth's radius in meters
  const φ1 = userLat * Math.PI/180;
  const φ2 = placeLat * Math.PI/180;
  const Δφ = (placeLat - userLat) * Math.PI/180;
  const Δλ = (placeLng - userLng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = Math.round(R * c); // Distance in meters
  
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
      latitude: placeLat,
      longitude: placeLng,
      address: place.vicinity || ''
    },
    priceRange: place.price_level as 1 | 2 | 3 | 4,
    openNow: place.opening_hours?.isOpen(),
    distance: distance,
    tags: place.types?.map(t => t.replace(/_/g, ' ')) || [],
    contact: {}
  };
  
  // Store in cache for future use
  placesCache.set(placeId, poi);
  
  return poi;
};

export const fetchPlaces = async (params: GoogleSearchParams): Promise<PointOfInterest[]> => {
  try {
    console.log("Initializing Google Maps API for fetchPlaces");
    await loadGoogleMapsApi();
    console.log("Fetching places for location:", params.location);
    
    return new Promise((resolve, reject) => {
      try {
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

        console.log("Sending request to Google Places API:", request);
        
        service.nearbySearch(request, (results, status) => {
          console.log("Google Places API response status:", status);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`Google API returned ${results.length} places`);
            resolve(results.map(place => transformGoogleToPointOfInterest(place, lat, lng)));
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log("Google Places API returned zero results");
            resolve([]);
          } else {
            console.error(`Google Places API error: ${status}`);
            reject(new Error(`Google Places API error: ${status}`));
          }
        });
      } catch (error) {
        console.error("Error in Places API request:", error);
        reject(error);
      }
    });
  } catch (error) {
    console.error("Failed to initialize Google Maps API:", error);
    throw error;
  }
};
