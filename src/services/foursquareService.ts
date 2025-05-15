
import { PointOfInterest } from "../types";

// Foursquare API configuration
const FOURSQUARE_API_URL = "https://api.foursquare.com/v3";
const FOURSQUARE_PLACES_ENDPOINT = "/places/search";

// We'll get this from the user input since we're using the free tier
let FOURSQUARE_API_KEY = "";

export const setFoursquareApiKey = (apiKey: string) => {
  FOURSQUARE_API_KEY = apiKey;
  localStorage.setItem("foursquareApiKey", apiKey);
};

export const getFoursquareApiKey = (): string => {
  if (!FOURSQUARE_API_KEY) {
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

export const transformFoursquareToPointOfInterest = (place: FoursquarePlace): PointOfInterest => {
  const category = mapCategoryToAppCategory(place.categories);
  const subcategory = place.categories.length > 0 ? place.categories[0].name : undefined;
  
  return {
    id: place.fsq_id,
    name: place.name,
    category,
    subcategory,
    description: `Located in ${place.location.formatted_address || place.location.locality || 'nearby'}`,
    rating: Math.random() * 2 + 3, // Random rating between 3 and 5 (Foursquare free API doesn't include ratings)
    reviews: Math.floor(Math.random() * 100) + 5, // Random review count
    image: getPlaceImage(place),
    location: {
      latitude: place.geocodes.main.latitude,
      longitude: place.geocodes.main.longitude,
      address: place.location.formatted_address || place.location.address || 'Address not available'
    },
    priceRange: Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3 | 4, // Random price range
    openNow: true, // We'll default to true since we'll filter by open_now
    distance: place.distance, // Already in meters
    tags: place.categories.map(c => c.name),
    contact: {}
  };
};

export const fetchPlaces = async (params: FoursquareSearchParams): Promise<PointOfInterest[]> => {
  const apiKey = getFoursquareApiKey();
  
  if (!apiKey) {
    throw new Error("Foursquare API key not set");
  }
  
  // Construct query parameters
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
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
