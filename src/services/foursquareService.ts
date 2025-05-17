import { PointOfInterest } from "../types";

// Foursquare API configuration
const FOURSQUARE_API_URL = "https://api.foursquare.com/v3";
const FOURSQUARE_PLACES_ENDPOINT = "/places/search";

// Default API key - this would normally be stored in an environment variable on the server
const DEFAULT_FOURSQUARE_API_KEY = "fsq3ATzZbJD1EtPtzErfG+4aBcoWeA8aTiQeP9DVi5X98QE=";

// We'll keep the local storage functionality for backward compatibility
let FOURSQUARE_API_KEY = DEFAULT_FOURSQUARE_API_KEY;

// Category mappings to Foursquare category IDs
// Reference: https://developer.foursquare.com/reference/categories
const CATEGORY_MAPPING = {
  food: "13000",      // Food category ID
  attractions: "10000", // Arts & Entertainment category ID
  activities: "17000"  // Shops & Services category ID
};

// Cache for place data to keep ratings and price ranges consistent
const placesCache: Record<string, PointOfInterest> = {};

export const setFoursquareApiKey = (apiKey: string) => {
  FOURSQUARE_API_KEY = apiKey;
  localStorage.setItem("foursquareApiKey", apiKey);
};

export const getFoursquareApiKey = (): string => {
  if (FOURSQUARE_API_KEY === DEFAULT_FOURSQUARE_API_KEY) {
    const savedKey = localStorage.getItem("foursquareApiKey");
    if (savedKey) {
      FOURSQUARE_API_KEY = savedKey;
    }
  }
  return FOURSQUARE_API_KEY;
};

export interface FoursquareSearchParams {
  ll: string; // latitude,longitude
  radius?: number; // in meters
  categories?: string;
  open_now?: boolean;
  sort?: "POPULARITY" | "RATING" | "DISTANCE";
  limit?: number;
  min_rating?: number;
  max_price?: number;
  query?: string;
}

// Convert our app categories to Foursquare category IDs
export const mapCategoriesToFoursquare = (categories: string[]): string => {
  if (!categories || categories.length === 0) {
    return "";
  }

  const mappedCategoryIds = categories.map(category => CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || "");
  return mappedCategoryIds.filter(id => id).join(',');
};

interface FoursquareLocation {
  address?: string;
  country?: string;
  cross_street?: string;
  locality?: string;
  postcode?: string;
  region?: string;
  formatted_address?: string;
}

interface FoursquareCategory {
  id: number;
  name: string;
  short_name: string;
  icon: {
    prefix: string;
    suffix: string;
  };
}

interface FoursquarePlace {
  fsq_id: string;
  categories: FoursquareCategory[];
  chains: any[];
  distance: number;
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  location: FoursquareLocation;
  name: string;
  related_places: any;
  timezone: string;
  hours?: {
    display?: string;
    is_local_holiday?: boolean;
    open_now?: boolean;
    regular?: {
      days: number[];
      open: string;  // HH:MM format
      close: string; // HH:MM format
    }[];
  };
}

interface FoursquareResponse {
  results: FoursquarePlace[];
}

const mapCategoryToAppCategory = (categories: FoursquareCategory[]): 'food' | 'attractions' | 'activities' => {
  if (!categories || categories.length === 0) {
    return 'attractions';
  }

  const category = categories[0].name.toLowerCase();
  
  if (category.includes('restaurant') || 
      category.includes('food') ||
      category.includes('cafe') ||
      category.includes('bar') ||
      category.includes('pub') ||
      category.includes('coffee')) {
    return 'food';
  } else if (category.includes('museum') ||
            category.includes('park') ||
            category.includes('landmark') ||
            category.includes('monument') ||
            category.includes('gallery')) {
    return 'attractions';
  } else {
    return 'activities';
  }
};

const getPlaceImage = (place: FoursquarePlace): string => {
  // Foursquare requires additional call for photos in free tier
  // We'll use placeholder images based on category
  const category = mapCategoryToAppCategory(place.categories);
  
  if (category === 'food') {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop';
  } else if (category === 'attractions') {
    return 'https://images.unsplash.com/photo-1544970828-5a98e7055193?w=800&auto=format&fit=crop';
  } else {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop';
  }
};

// Generate a consistent rating and price for a place
const generateConsistentPlaceData = (id: string): {rating: number, priceRange: 1 | 2 | 3 | 4} => {
  // Create a simple hash from the place ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Generate a rating between 3.5 and 5.0
  const rating = 3.5 + (Math.abs(hash) % 15) / 10;
  
  // Generate price range 1-4
  const priceRange = (Math.abs(hash) % 4 + 1) as 1 | 2 | 3 | 4;
  
  return { rating, priceRange };
};

export const transformFoursquareToPointOfInterest = (place: FoursquarePlace): PointOfInterest => {
  const id = place.fsq_id;
  const category = mapCategoryToAppCategory(place.categories);
  const subcategory = place.categories.length > 0 ? place.categories[0].name : undefined;
  
  // Check if we have this place cached
  if (placesCache[id]) {
    // Update only the dynamic properties like distance and opening hours
    return {
      ...placesCache[id],
      distance: place.distance,
      openNow: place.hours?.open_now ?? false,
      openingHours: place.hours?.regular?.map(hours => {
        const days = hours.days.map(day => {
          switch(day) {
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            case 6: return "Saturday";
            case 7: return "Sunday";
            default: return "";
          }
        });
        return `${days.join(", ")}: ${hours.open} - ${hours.close}`;
      })
    };
  }
  
  // Generate consistent rating and price range
  const { rating, priceRange } = generateConsistentPlaceData(id);
  
  const pointOfInterest: PointOfInterest = {
    id,
    name: place.name,
    category,
    subcategory,
    description: `Located in ${place.location.formatted_address || place.location.locality || 'nearby'}`,
    rating,
    reviews: Math.floor(Math.abs(id.charCodeAt(0) * 100) % 200) + 5, // Consistent reviews count
    image: getPlaceImage(place),
    location: {
      latitude: place.geocodes.main.latitude,
      longitude: place.geocodes.main.longitude,
      address: place.location.formatted_address || place.location.address || 'Address not available'
    },
    priceRange,
    openNow: place.hours?.open_now ?? false,
    openingHours: place.hours?.regular?.map(hours => {
      const days = hours.days.map(day => {
        switch(day) {
          case 1: return "Monday";
          case 2: return "Tuesday";
          case 3: return "Wednesday";
          case 4: return "Thursday";
          case 5: return "Friday";
          case 6: return "Saturday";
          case 7: return "Sunday";
          default: return "";
        }
      });
      return `${days.join(", ")}: ${hours.open} - ${hours.close}`;
    }),
    distance: place.distance,
    tags: place.categories.map(c => c.name),
    contact: {}
  };
  
  // Cache this place
  placesCache[id] = pointOfInterest;
  
  return pointOfInterest;
};

export const fetchPlaces = async (params: FoursquareSearchParams): Promise<PointOfInterest[]> => {
  const apiKey = getFoursquareApiKey();
  
  // Add fields parameter to get opening hours
  const fields = "fsq_id,name,categories,geocodes,location,distance,timezone,hours";
  
  // Construct query parameters
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  queryParams.append("fields", fields);
  
  try {
    const response = await fetch(`${FOURSQUARE_API_URL}${FOURSQUARE_PLACES_ENDPOINT}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`);
    }
    
    const data: FoursquareResponse = await response.json();
    return data.results.map(transformFoursquareToPointOfInterest);
    
  } catch (error) {
    console.error("Error fetching places from Foursquare:", error);
    throw error;
  }
};
