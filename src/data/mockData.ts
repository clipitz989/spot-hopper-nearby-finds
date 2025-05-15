
import { PointOfInterest } from '../types';

export const mockPOIs: PointOfInterest[] = [
  {
    id: '1',
    name: 'Riverside Café',
    category: 'food',
    subcategory: 'café',
    description: 'Cozy café with riverside views and excellent pastries',
    rating: 4.7,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      address: '123 River St, New York, NY'
    },
    priceRange: 2,
    openNow: true,
    distance: 800,
    tags: ['coffee', 'breakfast', 'pastries'],
    contact: {
      phone: '555-123-4567',
      website: 'https://example.com/riverside'
    }
  },
  {
    id: '2',
    name: 'Central Park',
    category: 'attractions',
    subcategory: 'park',
    description: 'Iconic urban park with walking trails, lakes, and scenic views',
    rating: 4.9,
    reviews: 543,
    image: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    location: {
      latitude: 40.7812,
      longitude: -73.9665,
      address: 'Central Park, New York, NY'
    },
    distance: 1200,
    tags: ['park', 'nature', 'walking', 'family-friendly'],
    openNow: true
  },
  {
    id: '3',
    name: 'City Museum',
    category: 'attractions',
    subcategory: 'museum',
    description: 'Interactive museum showcasing the city\'s rich history',
    rating: 4.5,
    reviews: 328,
    image: 'https://images.unsplash.com/photo-1566127444504-e252c4facfd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    location: {
      latitude: 40.7789,
      longitude: -73.9675,
      address: '456 Museum Ave, New York, NY'
    },
    priceRange: 3,
    openNow: false,
    distance: 1500,
    tags: ['art', 'history', 'culture'],
    contact: {
      phone: '555-987-6543',
      website: 'https://example.com/citymuseum'
    }
  },
  {
    id: '4',
    name: 'Downtown Food Tour',
    category: 'activities',
    subcategory: 'tour',
    description: 'Guided culinary tour of the city\'s best food spots',
    rating: 4.8,
    reviews: 96,
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    location: {
      latitude: 40.7112,
      longitude: -74.0123,
      address: 'Starts at: 789 Main St, New York, NY'
    },
    priceRange: 4,
    openNow: true,
    distance: 1100,
    tags: ['food', 'tour', 'walking'],
    contact: {
      phone: '555-789-0123',
      website: 'https://example.com/foodtour'
    }
  },
  {
    id: '5',
    name: 'Gourmet Burger Joint',
    category: 'food',
    subcategory: 'restaurant',
    description: 'Specialty burger restaurant with craft beers',
    rating: 4.6,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    location: {
      latitude: 40.7215,
      longitude: -73.9991,
      address: '321 Burger St, New York, NY'
    },
    priceRange: 3,
    openNow: true,
    distance: 600,
    tags: ['burgers', 'beer', 'dinner'],
    contact: {
      phone: '555-456-7890',
      website: 'https://example.com/burgerjoint'
    }
  },
  {
    id: '6',
    name: 'Skyline Observation Deck',
    category: 'attractions',
    subcategory: 'viewpoint',
    description: 'Panoramic city views from the top of a skyscraper',
    rating: 4.8,
    reviews: 402,
    image: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    location: {
      latitude: 40.7484,
      longitude: -73.9857,
      address: '100 Skyscraper Blvd, New York, NY'
    },
    priceRange: 4,
    openNow: true,
    distance: 2000,
    tags: ['views', 'photography', 'landmark'],
    contact: {
      phone: '555-246-8101',
      website: 'https://example.com/skylinedeck'
    }
  }
];
