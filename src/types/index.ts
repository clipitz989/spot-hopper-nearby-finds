export interface PointOfInterest {
  id: string;
  name: string;
  category: 'food' | 'bars' | 'attractions' | 'activities';
  subcategory?: string;
  description: string;
  rating: number;
  reviews: number;
  image: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  priceRange?: 1 | 2 | 3 | 4;
  openNow?: boolean;
  distance?: number; // in meters
  tags: string[];
  types?: string[]; // Google Places types
  contact?: {
    phone?: string;
    website?: string;
  };
  isFavorite?: boolean;
}

export interface Filter {
  openNow: boolean;
  minRating: number;
  maxDistance: number; // in km
  priceRange: number[];
  selectedCategories: string[];
}
