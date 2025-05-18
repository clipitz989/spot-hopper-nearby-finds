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
    "convenience_store",
    "ice_cream_shop",
    "pizza_restaurant",
    "fast_food_restaurant",
    "buffet_restaurant",
    "sushi_restaurant",
    "chinese_restaurant",
    "thai_restaurant",
    "indian_restaurant",
    "mexican_restaurant",
    "italian_restaurant",
    "japanese_restaurant",
    "vietnamese_restaurant",
    "mediterranean_restaurant",
    "steakhouse",
    "seafood_restaurant",
    "barbecue_restaurant",
    "vegetarian_restaurant",
    "vegan_restaurant",
    "food_court",
    "coffee_shop",
    "tea_house",
    "juice_bar",
    "dessert_shop",
    "food_truck",
    "sandwich_shop",
    "bagel_shop",
    "donut_shop",
    "health_food_store",
    "farmers_market"
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
    "establishment",
    "distillery",
    "beer_garden",
    "karaoke_bar",
    "lounge",
    "hookah_bar",
    "jazz_club",
    "comedy_club",
    "dance_club",
    "wine_cellar",
    "whiskey_bar",
    "tiki_bar",
    "gastropub",
    "microbrewery",
    "taproom",
    "beer_hall",
    "speakeasy"
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
    "point_of_interest",
    "historical_landmark",
    "monument",
    "botanical_garden",
    "national_park",
    "state_park",
    "beach",
    "scenic_point",
    "observation_deck",
    "performing_arts_theater",
    "concert_hall",
    "cultural_center",
    "science_museum",
    "history_museum",
    "art_museum",
    "children_museum",
    "planetarium",
    "sculpture_garden",
    "nature_preserve",
    "waterfall",
    "lake",
    "river",
    "garden",
    "historic_site",
    "historic_building",
    "castle",
    "palace",
    "lighthouse",
    "pier",
    "boardwalk",
    "marina",
    "temple",
    "cathedral",
    "mosque",
    "synagogue",
    "shrine"
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
    "beauty_salon",
    "sports_complex",
    "recreation_center",
    "yoga_studio",
    "pilates_studio",
    "climbing_gym",
    "swimming_pool",
    "tennis_court",
    "golf_course",
    "mini_golf",
    "water_park",
    "trampoline_park",
    "escape_room",
    "arcade",
    "laser_tag",
    "paintball_field",
    "go_kart_track",
    "ice_skating_rink",
    "roller_skating_rink",
    "skate_park",
    "bike_rental",
    "kayak_rental",
    "surf_shop",
    "cooking_school",
    "art_studio",
    "dance_studio",
    "music_venue",
    "bookstore",
    "craft_store",
    "hobby_shop",
    "antique_store",
    "flea_market",
    "outlet_mall",
    "farmers_market",
    "pet_store",
    "toy_store",
    "sporting_goods_store"
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
        
        // Define category-specific search configurations
        const categorySearches = {
          food: [
            // Basic searches
            { type: 'restaurant', keyword: undefined },
            { type: 'food', keyword: undefined },
            { type: 'establishment', keyword: 'food' },
            { type: 'establishment', keyword: 'restaurant' },
            // Specific establishment types
            { type: 'cafe', keyword: undefined },
            { type: 'bakery', keyword: undefined },
            { type: 'meal_takeaway', keyword: undefined },
            { type: 'meal_delivery', keyword: undefined },
            { type: 'supermarket', keyword: undefined },
            // Cuisine-specific searches
            { type: 'restaurant', keyword: 'american' },
            { type: 'restaurant', keyword: 'italian' },
            { type: 'restaurant', keyword: 'chinese' },
            { type: 'restaurant', keyword: 'japanese' },
            { type: 'restaurant', keyword: 'mexican' },
            { type: 'restaurant', keyword: 'thai' },
            { type: 'restaurant', keyword: 'indian' },
            { type: 'restaurant', keyword: 'mediterranean' },
            { type: 'restaurant', keyword: 'french' },
            { type: 'restaurant', keyword: 'vietnamese' },
            { type: 'restaurant', keyword: 'korean' },
            // Specific food types
            { type: 'restaurant', keyword: 'pizza' },
            { type: 'restaurant', keyword: 'burger' },
            { type: 'restaurant', keyword: 'sushi' },
            { type: 'restaurant', keyword: 'steak' },
            { type: 'restaurant', keyword: 'seafood' },
            { type: 'restaurant', keyword: 'sandwich' },
            { type: 'restaurant', keyword: 'breakfast' },
            { type: 'restaurant', keyword: 'brunch' },
            { type: 'restaurant', keyword: 'lunch' },
            { type: 'restaurant', keyword: 'dinner' },
            // Additional food establishments
            { type: 'establishment', keyword: 'deli' },
            { type: 'establishment', keyword: 'grill' },
            { type: 'establishment', keyword: 'diner' },
            { type: 'establishment', keyword: 'bistro' },
            { type: 'establishment', keyword: 'cafe' },
            { type: 'establishment', keyword: 'eatery' },
            // Catch-all search
            { type: 'establishment', keyword: 'dining' }
          ],
          bars: [
            // Basic bar searches
            { type: 'bar', keyword: undefined },
            { type: 'night_club', keyword: undefined },
            { type: 'establishment', keyword: 'bar' },
            // Specific bar types
            { type: 'bar', keyword: 'pub' },
            { type: 'bar', keyword: 'tavern' },
            { type: 'bar', keyword: 'brewery' },
            { type: 'bar', keyword: 'wine bar' },
            { type: 'restaurant', keyword: 'bar grill' },
            { type: 'restaurant', keyword: 'sports bar' },
            { type: 'establishment', keyword: 'lounge' },
            // Additional bar establishments
            { type: 'establishment', keyword: 'brewery' },
            { type: 'establishment', keyword: 'pub' },
            { type: 'establishment', keyword: 'cocktails' }
          ],
          attractions: [
            // Basic attraction searches
            { type: 'tourist_attraction', keyword: undefined },
            { type: 'point_of_interest', keyword: undefined },
            { type: 'establishment', keyword: 'attraction' },
            // Natural attractions
            { type: 'park', keyword: undefined },
            { type: 'natural_feature', keyword: undefined },
            // Cultural attractions
            { type: 'museum', keyword: undefined },
            { type: 'art_gallery', keyword: undefined },
            { type: 'church', keyword: undefined },
            { type: 'place_of_worship', keyword: undefined },
            // Entertainment
            { type: 'amusement_park', keyword: undefined },
            { type: 'aquarium', keyword: undefined },
            { type: 'zoo', keyword: undefined },
            { type: 'stadium', keyword: undefined },
            // Historical
            { type: 'establishment', keyword: 'historical' },
            { type: 'establishment', keyword: 'landmark' },
            // Catch-all
            { type: 'establishment', keyword: 'tourist' }
          ],
          activities: [
            // Shopping
            { type: 'shopping_mall', keyword: undefined },
            { type: 'store', keyword: undefined },
            { type: 'clothing_store', keyword: undefined },
            { type: 'department_store', keyword: undefined },
            // Recreation
            { type: 'gym', keyword: undefined },
            { type: 'fitness', keyword: undefined },
            { type: 'spa', keyword: undefined },
            { type: 'bowling_alley', keyword: undefined },
            { type: 'movie_theater', keyword: undefined },
            // Sports and Recreation
            { type: 'establishment', keyword: 'fitness' },
            { type: 'establishment', keyword: 'recreation' },
            { type: 'establishment', keyword: 'sports' },
            // Entertainment
            { type: 'establishment', keyword: 'entertainment' },
            { type: 'establishment', keyword: 'activities' },
            // Catch-all
            { type: 'establishment', keyword: 'fun' }
          ]
        };

        // Determine which searches to perform based on the selected type
        let searchConfigs = [];
        if (params.type) {
          // If a specific type is selected, find the category it belongs to
          for (const [category, types] of Object.entries(CATEGORY_MAPPING)) {
            if (types.includes(params.type)) {
              searchConfigs = categorySearches[category as keyof typeof categorySearches];
              break;
            }
          }
          // If no category found, use the specific type
          if (searchConfigs.length === 0) {
            searchConfigs = [{ type: params.type, keyword: params.keyword }];
          }
        } else {
          // If no type specified, search all categories
          searchConfigs = Object.values(categorySearches).flat();
        }
        
        console.log("Starting searches with configs:", searchConfigs);
        
        // Perform all searches in parallel
        Promise.all(searchConfigs.map(search => 
          new Promise<google.maps.places.PlaceResult[]>((resolveSearch) => {
            const searchRequest: google.maps.places.PlaceSearchRequest = {
              location: new google.maps.LatLng(lat, lng),
              radius: params.radius || 15000, // Increased to 15km radius for maximum coverage
              type: search.type,
              keyword: search.keyword,
              openNow: params.opennow,
              minPriceLevel: params.minprice,
              maxPriceLevel: params.maxprice
            };

            console.log(`Executing search with params:`, searchRequest);

            service.nearbySearch(searchRequest, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                console.log(`Search successful for type: ${search.type}, found ${results.length} results`);
                resolveSearch(results);
              } else {
                console.log(`Search failed for type: ${search.type}, keyword: ${search.keyword}, status: ${status}`);
                resolveSearch([]);
              }
            });
          })
        )).then(searchResults => {
          // Combine and deduplicate results
          const seenPlaceIds = new Set<string>();
          const allResults = searchResults.flat().filter(place => {
            if (!place.place_id || seenPlaceIds.has(place.place_id)) return false;
            if (!place.geometry || !place.geometry.location) return false; // Filter out places without valid locations
            seenPlaceIds.add(place.place_id);
            return true;
          });
          
          console.log(`Total results before transformation: ${allResults.length}`);
          
          const transformedResults = allResults.map(place => {
            const poi = transformGoogleToPointOfInterest(place, lat, lng);
            
            // Determine the category based on place types and other signals
            if (place.types) {
              if (isLikelyBar(place)) {
                poi.category = 'bars';
              } else if (place.types.some(type => CATEGORY_MAPPING.food.includes(type)) || 
                        (place.name && /restaurant|cafe|food|pizza|sushi|thai|chinese|mexican|italian/i.test(place.name))) {
                poi.category = 'food';
              } else if (place.types.some(type => CATEGORY_MAPPING.attractions.includes(type))) {
                poi.category = 'attractions';
              } else if (place.types.some(type => CATEGORY_MAPPING.activities.includes(type))) {
                poi.category = 'activities';
              }
            }
            
            return poi;
          });
          
          // Sort results by distance
          transformedResults.sort((a, b) => a.distance - b.distance);
          
          console.log(`Found ${transformedResults.length} total places after deduplication`);
          console.log(`Categories breakdown:`, 
            transformedResults.reduce((acc, curr) => {
              acc[curr.category] = (acc[curr.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          );
          
          resolve(transformedResults);
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
