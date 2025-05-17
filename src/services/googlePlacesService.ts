import { PointOfInterest } from "../types";

// Google Places API configuration
export const GOOGLE_API_KEY = "AIzaSyAzCHbNOtqBj7HAZ1-XJ0uXtmqtbvheW-c";
const GOOGLE_PLACES_API_URL = "https://maps.googleapis.com/maps/api/place";

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

interface GooglePlace {
  place_id: string;
  name: string;
  types: string[];
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
}

const getPlaceImage = (place: GooglePlace): string => {
  if (place.photos && place.photos.length > 0) {
    const photoReference = place.photos[0].photo_reference;
    return `${GOOGLE_PLACES_API_URL}/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
  }

  // Fallback images based on category
  const type = place.types[0] || '';
  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop';
  } else if (type.includes('museum') || type.includes('park') || type.includes('attraction')) {
    return 'https://images.unsplash.com/photo-1544970828-5a98e7055193?w=800&auto=format&fit=crop';
  } else {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop';
  }
};

const mapGoogleTypeToCategory = (types: string[]): 'food' | 'attractions' | 'activities' => {
  const type = types[0]?.toLowerCase() || '';
  
  if (type.includes('restaurant') || 
      type.includes('food') ||
      type.includes('cafe') ||
      type.includes('bar') ||
      type.includes('bakery')) {
    return 'food';
  } else if (type.includes('museum') ||
            type.includes('park') ||
            type.includes('attraction') ||
            type.includes('landmark')) {
    return 'attractions';
  } else {
    return 'activities';
  }
};

export const transformGoogleToPointOfInterest = (place: GooglePlace): PointOfInterest => {
  const category = mapGoogleTypeToCategory(place.types);
  
  return {
    id: place.place_id,
    name: place.name,
    category,
    subcategory: place.types[0]?.replace(/_/g, ' '),
    description: `Located in ${place.vicinity}`,
    rating: place.rating || 4.0,
    reviews: place.user_ratings_total || 0,
    image: getPlaceImage(place),
    location: {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      address: place.vicinity
    },
    priceRange: (place.price_level as 1 | 2 | 3 | 4) || undefined,
    openNow: place.opening_hours?.open_now,
    tags: place.types.map(t => t.replace(/_/g, ' ')),
    contact: {}
  };
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const fetchPlaces = async (params: GoogleSearchParams): Promise<PointOfInterest[]> => {
  // Construct query parameters
  const queryParams = new URLSearchParams();
  // Add API key
  queryParams.append('key', GOOGLE_API_KEY);
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `${GOOGLE_PLACES_API_URL}/nearbysearch/json?${queryParams}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      const data: GooglePlacesResponse = await response.json();
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry...`);
        await wait(waitTime);
        continue;
      }
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status}`);
      }
      
      return (data.results || []).map(transformGoogleToPointOfInterest);
      
    } catch (error) {
      console.error(`Error fetching places from Google (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
      lastError = error as Error;
      
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await wait(waitTime);
      }
    }
  }
  
  throw new Error(
    lastError?.message || 
    'Failed to fetch places after multiple retries. Please try again later.'
  );
}; 