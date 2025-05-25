import { PointOfInterest } from "../types";

// Foursquare API configuration
const FOURSQUARE_API_KEY = "fsq3fCQBTAK7w488YQlsOjpwjb5f/8Xk4++sAu9S4kpnRC8=";
const FOURSQUARE_API_URL = "https://api.foursquare.com/v3";

// Create a cache to store place data by ID to maintain consistency
const placesCache = new Map<string, PointOfInterest>();

// Function to clear cache when location changes
export const clearPlacesCache = () => {
  console.log("Clearing places cache");
  placesCache.clear();
};

// Category mappings to Foursquare categories
const CATEGORY_MAPPING = {
  food: [
    "13065", // Restaurant
    "13002", // Cafe
    "13003", // Bakery
    "13004", // Bar
    "13005", // Pub
    "13006", // Fast Food
    "13007", // Food Court
    "13008", // Food Stand
    "13009", // Food Truck
    "13010", // Ice Cream Shop
    "13011", // Pizza Place
    "13012", // Sandwich Place
    "13013", // Seafood Restaurant
    "13014", // Steakhouse
    "13015", // Sushi Restaurant
    "13016", // Thai Restaurant
    "13017", // Vietnamese Restaurant
    "13018", // Indian Restaurant
    "13019", // Mexican Restaurant
    "13020", // Italian Restaurant
    "13021", // Japanese Restaurant
    "13022", // Chinese Restaurant
    "13023", // Mediterranean Restaurant
    "13024", // Vegetarian Restaurant
    "13025", // Vegan Restaurant
    "13026", // Health Food Store
    "13027", // Grocery Store
    "13028", // Supermarket
    "13029", // Convenience Store
    "13030", // Deli
    "13031", // Farmers Market
    "13032", // Food & Drink Shop
    "13033", // Food & Drink Service
    "13034", // Food & Drink Store
    "13035", // Food & Drink Venue
    "13036", // Food & Drink Place
    "13037", // Food & Drink Establishment
    "13038", // Food & Drink Business
    "13039", // Food & Drink Company
    "13040", // Food & Drink Organization
    "13041", // Food & Drink Institution
    "13042", // Food & Drink Facility
    "13043", // Food & Drink Center
    "13044", // Food & Drink Complex
    "13045", // Food & Drink Park
    "13046", // Food & Drink Garden
    "13047", // Food & Drink Plaza
    "13048", // Food & Drink Square
    "13049", // Food & Drink Street
    "13050", // Food & Drink Road
    "13051", // Food & Drink Avenue
    "13052", // Food & Drink Boulevard
    "13053", // Food & Drink Lane
    "13054", // Food & Drink Drive
    "13055", // Food & Drink Court
    "13056", // Food & Drink Circle
    "13057", // Food & Drink Way
    "13058", // Food & Drink Place
    "13059", // Food & Drink Point
    "13060", // Food & Drink Spot
    "13061", // Food & Drink Location
    "13062", // Food & Drink Site
    "13063", // Food & Drink Area
    "13064", // Food & Drink Zone
  ],
  bars: [
    "13004", // Bar
    "13005", // Pub
    "13006", // Fast Food
    "13007", // Food Court
    "13008", // Food Stand
    "13009", // Food Truck
    "13010", // Ice Cream Shop
    "13011", // Pizza Place
    "13012", // Sandwich Place
    "13013", // Seafood Restaurant
    "13014", // Steakhouse
    "13015", // Sushi Restaurant
    "13016", // Thai Restaurant
    "13017", // Vietnamese Restaurant
    "13018", // Indian Restaurant
    "13019", // Mexican Restaurant
    "13020", // Italian Restaurant
    "13021", // Japanese Restaurant
    "13022", // Chinese Restaurant
    "13023", // Mediterranean Restaurant
    "13024", // Vegetarian Restaurant
    "13025", // Vegan Restaurant
    "13026", // Health Food Store
    "13027", // Grocery Store
    "13028", // Supermarket
    "13029", // Convenience Store
    "13030", // Deli
    "13031", // Farmers Market
    "13032", // Food & Drink Shop
    "13033", // Food & Drink Service
    "13034", // Food & Drink Store
    "13035", // Food & Drink Venue
    "13036", // Food & Drink Place
    "13037", // Food & Drink Establishment
    "13038", // Food & Drink Business
    "13039", // Food & Drink Company
    "13040", // Food & Drink Organization
    "13041", // Food & Drink Institution
    "13042", // Food & Drink Facility
    "13043", // Food & Drink Center
    "13044", // Food & Drink Complex
    "13045", // Food & Drink Park
    "13046", // Food & Drink Garden
    "13047", // Food & Drink Plaza
    "13048", // Food & Drink Square
    "13049", // Food & Drink Street
    "13050", // Food & Drink Road
    "13051", // Food & Drink Avenue
    "13052", // Food & Drink Boulevard
    "13053", // Food & Drink Lane
    "13054", // Food & Drink Drive
    "13055", // Food & Drink Court
    "13056", // Food & Drink Circle
    "13057", // Food & Drink Way
    "13058", // Food & Drink Place
    "13059", // Food & Drink Point
    "13060", // Food & Drink Spot
    "13061", // Food & Drink Location
    "13062", // Food & Drink Site
    "13063", // Food & Drink Area
    "13064", // Food & Drink Zone
  ],
  attractions: [
    "10000", // Arts & Entertainment
    "10001", // Museum
    "10002", // Art Gallery
    "10003", // Theater
    "10004", // Concert Hall
    "10005", // Stadium
    "10006", // Arena
    "10007", // Convention Center
    "10008", // Exhibition Center
    "10009", // Fairground
    "10010", // Theme Park
    "10011", // Amusement Park
    "10012", // Water Park
    "10013", // Aquarium
    "10014", // Zoo
    "10015", // Botanical Garden
    "10016", // Park
    "10017", // Beach
    "10018", // Lake
    "10019", // River
    "10020", // Mountain
    "10021", // Forest
    "10022", // Garden
    "10023", // Plaza
    "10024", // Square
    "10025", // Street
    "10026", // Road
    "10027", // Avenue
    "10028", // Boulevard
    "10029", // Lane
    "10030", // Drive
    "10031", // Court
    "10032", // Circle
    "10033", // Way
    "10034", // Place
    "10035", // Point
    "10036", // Spot
    "10037", // Location
    "10038", // Site
    "10039", // Area
    "10040", // Zone
  ],
  activities: [
    "11000", // Shopping
    "11001", // Mall
    "11002", // Store
    "11003", // Shop
    "11004", // Market
    "11005", // Supermarket
    "11006", // Grocery Store
    "11007", // Convenience Store
    "11008", // Department Store
    "11009", // Clothing Store
    "11010", // Shoe Store
    "11011", // Jewelry Store
    "11012", // Bookstore
    "11013", // Music Store
    "11014", // Electronics Store
    "11015", // Home Goods Store
    "11016", // Furniture Store
    "11017", // Antique Store
    "11018", // Thrift Store
    "11019", // Flea Market
    "11020", // Farmers Market
    "11021", // Food & Drink Shop
    "11022", // Food & Drink Service
    "11023", // Food & Drink Store
    "11024", // Food & Drink Venue
    "11025", // Food & Drink Place
    "11026", // Food & Drink Establishment
    "11027", // Food & Drink Business
    "11028", // Food & Drink Company
    "11029", // Food & Drink Organization
    "11030", // Food & Drink Institution
    "11031", // Food & Drink Facility
    "11032", // Food & Drink Center
    "11033", // Food & Drink Complex
    "11034", // Food & Drink Park
    "11035", // Food & Drink Garden
    "11036", // Food & Drink Plaza
    "11037", // Food & Drink Square
    "11038", // Food & Drink Street
    "11039", // Food & Drink Road
    "11040", // Food & Drink Avenue
    "11041", // Food & Drink Boulevard
    "11042", // Food & Drink Lane
    "11043", // Food & Drink Drive
    "11044", // Food & Drink Court
    "11045", // Food & Drink Circle
    "11046", // Food & Drink Way
    "11047", // Food & Drink Place
    "11048", // Food & Drink Point
    "11049", // Food & Drink Spot
    "11050", // Food & Drink Location
    "11051", // Food & Drink Site
    "11052", // Food & Drink Area
    "11053", // Food & Drink Zone
  ]
};

export interface FoursquareSearchParams {
  location: string; // latitude,longitude
  radius?: number; // in meters
  categories?: string[];
  query?: string;
  openNow?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Convert our app categories to Foursquare categories
export const mapCategoriesToFoursquare = (categories: string[]): string[] => {
  if (!categories || categories.length === 0) {
    return [];
  }

  return categories.flatMap(category => 
    CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || []
  );
};

const transformFoursquareToPointOfInterest = (place: any, userLat: number, userLng: number): PointOfInterest => {
  // Check if we already have this place in the cache
  const placeId = place.fsq_id;
  if (placesCache.has(placeId)) {
    console.log(`Using cached data for place: ${placeId}`);
    return placesCache.get(placeId)!;
  }
  
  console.log(`Creating new place object for: ${place.name} (${placeId})`);
  
  const placeLat = place.geocodes.main.latitude;
  const placeLng = place.geocodes.main.longitude;
  
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
  
  // Create a new place object
  const poi: PointOfInterest = {
    id: placeId,
    name: place.name,
    category: 'food', // We'll determine this based on categories
    subcategory: place.categories[0]?.name,
    description: place.description || '',
    rating: place.rating || 4.0,
    reviews: place.stats?.total_ratings || 0,
    image: place.photos?.[0]?.prefix + '300x300' + place.photos?.[0]?.suffix || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    location: {
      latitude: placeLat,
      longitude: placeLng,
      address: place.location.formatted_address || ''
    },
    priceRange: place.price || 1,
    openNow: place.hours?.is_open || false,
    distance: distanceInMiles,
    tags: place.categories?.map((c: any) => c.name) || [],
    contact: {
      phone: place.tel,
      website: place.website
    }
  };
  
  // Store in cache for future use
  placesCache.set(placeId, poi);
  
  return poi;
};

// Add rate limiting
const RATE_LIMIT = 1000; // 1 second between requests
let lastRequestTime = 0;

const rateLimitedFetch = async <T>(request: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const timeToWait = Math.max(0, RATE_LIMIT - (now - lastRequestTime));
  if (timeToWait > 0) {
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  lastRequestTime = Date.now();
  return request();
};

export const fetchPlaces = async (params: FoursquareSearchParams): Promise<PointOfInterest[]> => {
  try {
    console.log("Fetching places from Foursquare API");
    const [lat, lng] = params.location.split(',').map(Number);
    
    const queryParams = new URLSearchParams({
      ll: params.location,
      radius: (params.radius || 15000).toString(),
      limit: '50',
      sort: 'RATING',
      fields: 'fsq_id,name,description,rating,stats,photos,geocodes,location,hours,price,tel,website,categories'
    });

    if (params.query) {
      queryParams.append('query', params.query);
    }

    if (params.categories && params.categories.length > 0) {
      queryParams.append('categories', params.categories.join(','));
    }

    if (params.openNow) {
      queryParams.append('open_now', 'true');
    }

    if (params.minPrice !== undefined) {
      queryParams.append('min_price', params.minPrice.toString());
    }

    if (params.maxPrice !== undefined) {
      queryParams.append('max_price', params.maxPrice.toString());
    }

    console.log("Making request to Foursquare API with params:", queryParams.toString());

    const response = await rateLimitedFetch(() => 
      fetch(`${FOURSQUARE_API_URL}/places/search?${queryParams}`, {
        headers: {
          'Authorization': FOURSQUARE_API_KEY,
          'Accept': 'application/json'
        }
      })
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Foursquare API error response:", errorText);
      throw new Error(`Foursquare API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Foursquare API returned ${data.results?.length || 0} results`);

    if (!data.results) {
      console.log("No results found in Foursquare API response");
      return [];
    }

    const transformedResults = data.results.map((place: any) => 
      transformFoursquareToPointOfInterest(place, lat, lng)
    );

    // Sort results by distance
    transformedResults.sort((a, b) => a.distance - b.distance);
    
    console.log(`Transformed ${transformedResults.length} places`);
    return transformedResults;
  } catch (error) {
    console.error("Error fetching places from Foursquare:", error);
    throw error;
  }
}; 