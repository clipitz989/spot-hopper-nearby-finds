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
  food: [
    "restaurant",
    "cafe",
    "bakery",
    "meal_takeaway",
    "meal_delivery",
    "food",
    "supermarket",
    "grocery_or_supermarket",
    "deli",
    "convenience_store"
  ],
  bars: [
    "bar",
    "night_club",
    "liquor_store",
    "brewery",
    "wine_bar",
    "rooftop_bar",
    "pub",
    "cocktail_bar",
    "sports_bar",
    "irish_pub",
    "dive_bar",
    "tavern",
    "restaurant",  // Include restaurant to catch hybrid places
    "establishment"
  ],
  attractions: [
    "tourist_attraction",
    "museum",
    "park",
    "art_gallery",
    "landmark",
    "amusement_park",
    "aquarium",
    "church",
    "city_hall",
    "library",
    "movie_theater",
    "zoo",
    "stadium",
    "point_of_interest"
  ],
  activities: [
    "shopping_mall",
    "store",
    "gym",
    "spa",
    "amusement_park",
    "bowling_alley",
    "casino",
    "movie_theater",
    "shopping_mall",
    "clothing_store",
    "department_store",
    "electronics_store",
    "fitness_center",
    "hair_care",
    "beauty_salon"
  ]
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
  const distanceInMeters = R * c;
  const rawMiles = distanceInMeters * 0.000621371;
  
  // Format distance with appropriate precision
  const distanceInMiles = rawMiles < 1 ? 
    +rawMiles.toFixed(2) : // Show 2 decimals for distances under 1 mile
    +rawMiles.toFixed(1);  // Show 1 decimal for distances over 1 mile
  
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
    distance: distanceInMiles,
    tags: place.types?.map(t => t.replace(/_/g, ' ')) || [],
    contact: {}
  };
  
  // Store in cache for future use
  placesCache.set(placeId, poi);
  
  return poi;
};

// Helper function to check if a place is likely a bar based on its name and types
const isLikelyBar = (place: google.maps.places.PlaceResult): boolean => {
  const barKeywords = [
    'bar', 'pub', 'tavern', 'lounge', 'beer', 'wine', 'spirits',
    'cocktail', 'brewery', 'ale', 'saloon', "kelly's", 'kellys',
    'tap', 'grill', 'sports', 'cantina', 'inn', 'alehouse',
    'gastropub', 'public house', 'roadhouse', 'oyster', 'seafood',
    'steakhouse', 'grill', 'kitchen', 'bistro', 'rye', 'port'
  ];
  
  // Check name for bar-related keywords
  const nameLower = place.name?.toLowerCase() || '';
  if (barKeywords.some(keyword => nameLower.includes(keyword))) {
    return true;
  }

  // Check if it has bar-related types
  if (place.types?.some(type => 
    ['bar', 'night_club', 'brewery', 'pub', 'restaurant'].includes(type)
  )) {
    return true;
  }

  // Check if it serves alcohol (if this information is available)
  const servesAlcohol = place.types?.includes('establishment') && 
    (place.types?.includes('restaurant') || place.types?.includes('bar'));

  // Check business status and rating as additional signals
  const isPopularEvening = place.rating && place.rating >= 4.0 && 
    place.types?.includes('restaurant') &&
    place.opening_hours?.periods?.some(period => 
      period.close && parseInt(period.close.time) >= 2200
    );

  return servesAlcohol || isPopularEvening;
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
        
        // For bars category, we'll make multiple searches to ensure comprehensive results
        if (params.type === 'bar') {
          const searches = [
            { type: 'bar', keyword: 'bar pub tavern' },
            { type: 'restaurant', keyword: 'bar grill pub tavern' },
            { type: 'night_club', keyword: undefined },
            { type: 'restaurant', keyword: 'sports bar lounge' }
          ];
          
          Promise.all(searches.map(search => 
            new Promise<google.maps.places.PlaceResult[]>((resolveSearch) => {
              service.nearbySearch({
                location: new google.maps.LatLng(lat, lng),
                radius: 5000,
                type: search.type,
                keyword: search.keyword,
                openNow: params.opennow,
                minPriceLevel: params.minprice,
                maxPriceLevel: params.maxprice
              }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                  resolveSearch(results);
                } else {
                  resolveSearch([]);
                }
              });
            })
          )).then(searchResults => {
            // Combine and deduplicate results
            const seenPlaceIds = new Set<string>();
            const allResults = searchResults.flat().filter(place => {
              if (!place.place_id || seenPlaceIds.has(place.place_id)) return false;
              seenPlaceIds.add(place.place_id);
              return true;
            });
            
            const transformedResults = allResults.map(place => {
              const poi = transformGoogleToPointOfInterest(place, lat, lng);
              if (isLikelyBar(place)) {
                poi.category = 'bars';
              }
              return poi;
            }).filter(poi => poi.category === 'bars');
            
            transformedResults.sort((a, b) => a.distance - b.distance);
            resolve(transformedResults);
          });
          
          return;
        }
        
        // Regular search for other categories
        const request = {
          location: new google.maps.LatLng(lat, lng),
          radius: 5000,
          type: params.type,
          keyword: params.type === 'restaurant' ? 'restaurant food' : 
                  params.type === 'tourist_attraction' ? 'attraction tourism' :
                  params.type === 'shopping_mall' ? 'shopping activities' :
                  undefined,
          openNow: params.opennow,
          minPriceLevel: params.minprice,
          maxPriceLevel: params.maxprice
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const transformedResults = results.map(place => {
              const poi = transformGoogleToPointOfInterest(place, lat, lng);
              
              if (place.types) {
                if (isLikelyBar(place)) {
                  poi.category = 'bars';
                } else if (place.types.some(type => CATEGORY_MAPPING.food.includes(type))) {
                  poi.category = 'food';
                } else if (place.types.some(type => CATEGORY_MAPPING.attractions.includes(type))) {
                  poi.category = 'attractions';
                } else if (place.types.some(type => CATEGORY_MAPPING.activities.includes(type))) {
                  poi.category = 'activities';
                }
              }
              
              return poi;
            });
            
            transformedResults.sort((a, b) => a.distance - b.distance);
            resolve(transformedResults);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
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
