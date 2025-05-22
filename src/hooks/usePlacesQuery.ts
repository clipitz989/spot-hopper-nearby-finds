import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlaces, GoogleSearchParams, mapCategoriesToGoogle, clearPlacesCache } from "../services/googlePlacesService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect } from "react";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
  naturalQuery?: string;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading, locationChangeCounter } = useLocation();
  const { enabled = true, filters, naturalQuery } = options;
  const queryClient = useQueryClient();

  // Create query key with all dependencies that should trigger a refetch
  const queryKey = ['places', 
    position?.latitude, 
    position?.longitude, 
    filters, 
    naturalQuery,
    locationChangeCounter
  ];
  
  const query = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!position) {
        console.log("No position available, returning empty array");
        return [];
      }
      
      console.log(`Fetching places for position: ${position.latitude},${position.longitude}, counter: ${locationChangeCounter}`);
      
      // Clear the places cache when refetching at a new location
      clearPlacesCache();
      
      const params: GoogleSearchParams = {
        location: `${position.latitude},${position.longitude}`,
        radius: filters?.maxDistance ? filters.maxDistance * 1000 : 10000, // Convert km to meters
        opennow: filters?.openNow,
      };
      
      // Process natural language query if provided
      if (naturalQuery) {
        console.log("Using natural language query:", naturalQuery);
        
        const naturalQueryLower = naturalQuery.toLowerCase();
        
        // Movie and entertainment related terms
        const movieTerms = ["movie", "cinema", "theater", "theatre", "film"];
        const watchTerms = ["watch", "see", "viewing"];
        
        // Sports and game watching related terms
        const sportsTerms = [
          "game", "match", "sports", "watch", "stadium", "arena", 
          "basketball", "football", "baseball", "soccer", "hockey"
        ];
        
        // Dining related terms with subcategories
        const diningCategories = {
          general: ["eat", "food", "restaurant", "dinner", "lunch", "breakfast", "cuisine", "meal", "dining", "hungry", "bite"],
          steak: ["steak", "steakhouse", "prime rib", "ribeye", "filet"],
          seafood: ["seafood", "fish", "sushi", "oyster"],
          italian: ["italian", "pasta", "pizza"],
          chinese: ["chinese", "dim sum", "asian"],
          mexican: ["mexican", "tacos", "burrito"],
          japanese: ["japanese", "sushi", "ramen"],
          thai: ["thai", "pad thai"],
          indian: ["indian", "curry"],
          mediterranean: ["mediterranean", "greek", "kebab"]
        };

        // Park related terms
        const parkTerms = ["park", "playground", "garden", "trail", "nature"];
        
        // Check for movie/cinema intent
        if (movieTerms.some(term => naturalQueryLower.includes(term)) ||
            (watchTerms.some(term => naturalQueryLower.includes(term)) && 
             naturalQueryLower.includes("movie"))) {
          params.type = "movie_theater";
          params.keyword = "movie theater cinema";
          params._intent = "movie";
        }
        // Check for park intent
        else if (parkTerms.some(term => naturalQueryLower.includes(term))) {
          params.type = "park";
          params.keyword = naturalQueryLower; // Include the original search term
          params._intent = "park";
        }
        // Check for sports/game watching intent
        else if (sportsTerms.some(term => naturalQueryLower.includes(term))) {
          params.type = "bar";
          params.keyword = "sports bar";
          params._intent = "sports";
        }
        // Check for specific dining intents
        else {
          for (const [cuisine, terms] of Object.entries(diningCategories)) {
            if (cuisine !== 'general' && terms.some(term => naturalQueryLower.includes(term))) {
              params.type = "restaurant";
              params.keyword = naturalQueryLower; // Include the original search term
              params._intent = `cuisine_${cuisine}`;
              break;
            }
          }
          
          // If no specific cuisine found, check for general dining intent
          if (!params._intent && diningCategories.general.some(term => naturalQueryLower.includes(term))) {
            params.type = "restaurant";
            params.keyword = naturalQueryLower; // Include the original search term
            params._intent = "dining_general";
          }
        }

        // If no specific intent was found, use the natural query as a keyword
        if (!params._intent) {
          params.type = "establishment";
          params.keyword = naturalQueryLower;
          params._intent = "general_search";
        }
      } else if (filters?.selectedCategories && filters.selectedCategories.length > 0) {
        // Only use category filters if not using natural search
        const types = mapCategoriesToGoogle(filters.selectedCategories);
        if (types.length > 0) {
          // Google Places API only allows one type at a time, so we'll use the first one
          params.type = types[0];
        }
      }
      
      // Add price range filter
      if (filters?.priceRange) {
        params.minprice = filters.priceRange[0] - 1; // Google uses 0-4 scale
        params.maxprice = filters.priceRange[1] - 1;
      }
      
      console.log("Fetching places with params:", params, "locationChangeCounter:", locationChangeCounter);
      
      try {
        const places = await fetchPlaces(params);
        console.log(`Successfully fetched ${places.length} places`);
        
        // Apply strict post-query filtering based on intent
        let filteredPlaces = places;
        
        if (params._intent) {
          console.log(`Applying strict filtering for intent: ${params._intent}`);
          
          switch (params._intent) {
            case 'movie':
              // Strictly filter for movie theaters
              filteredPlaces = places.filter(place => {
                const nameLower = place.name.toLowerCase();
                const isMovieTheater = 
                  nameLower.includes('movie') || 
                  nameLower.includes('cinema') ||
                  nameLower.includes('theater') ||
                  nameLower.includes('theatre') ||
                  place.tags.includes('movie_theater');
                
                return isMovieTheater;
              });
              break;

            case 'park':
              // Strictly filter for parks
              filteredPlaces = places.filter(place => {
                const nameLower = place.name.toLowerCase();
                const isPark = 
                  nameLower.includes('park') || 
                  nameLower.includes('garden') ||
                  place.tags.some(tag => 
                    tag.includes('park') || 
                    tag.includes('garden') ||
                    tag === 'natural_feature'
                  );
                
                return isPark;
              });
              break;

            case 'sports':
              // Strictly filter for sports bars
              filteredPlaces = places.filter(place => {
                const nameLower = place.name.toLowerCase();
                const hasSportsInName = nameLower.includes('sports') || 
                                     nameLower.includes('stadium') || 
                                     nameLower.includes('arena');
                
                const hasSportsTag = place.tags.some(tag => 
                  tag === 'sports bar' || 
                  tag === 'stadium' || 
                  tag === 'arena'
                );
                
                return hasSportsInName || hasSportsTag || 
                       (place.category === 'bars' && 
                        place.rating >= 4.0 && 
                        place.tags.some(tag => tag.includes('bar')));
              });
              break;
            
            case 'cuisine_steak':
              // Strictly filter for steakhouses
              filteredPlaces = places.filter(place => {
                const nameLower = place.name.toLowerCase();
                const isExplicitSteakhouse = 
                  nameLower.includes('steak') || 
                  nameLower.includes('steakhouse') ||
                  place.tags.includes('steakhouse');
                
                return isExplicitSteakhouse || 
                       (place.category === 'food' && 
                        place.rating >= 4.2 &&
                        place.tags.some(tag => 
                          tag === 'steakhouse' || 
                          tag === 'steak restaurant' || 
                          tag === 'american restaurant'
                        ));
              });
              break;
            
            case 'general_search':
              // For general searches, ensure the search term appears in name or tags
              if (naturalQuery) {
                const searchTerms = naturalQuery.toLowerCase().split(' ');
                filteredPlaces = places.filter(place => {
                  const nameLower = place.name.toLowerCase();
                  return searchTerms.some(term => 
                    nameLower.includes(term) || 
                    place.tags.some(tag => tag.includes(term))
                  );
                });
              }
              break;

            default:
              if (params._intent.startsWith('cuisine_')) {
                const cuisine = params._intent.replace('cuisine_', '');
                filteredPlaces = places.filter(place => {
                  const nameLower = place.name.toLowerCase();
                  const isExplicitCuisine = 
                    nameLower.includes(cuisine) || 
                    place.tags.some(tag => tag === `${cuisine} restaurant`);
                  
                  return isExplicitCuisine || 
                         (place.category === 'food' && 
                          place.rating >= 4.0 &&
                          place.tags.some(tag => tag.includes(cuisine)));
                });
              }
              break;
          }
          
          console.log(`Filtered to ${filteredPlaces.length} places after strict intent filtering`);
          
          // Only fall back if we have absolutely no results
          if (filteredPlaces.length === 0) {
            console.log('No places matched strict filters, using top-rated relevant places');
            // Fall back to highly-rated places of the correct category
            filteredPlaces = places.filter(place => 
              place.rating >= 4.2 && 
              (params.type === 'bar' ? place.category === 'bars' : place.category === 'food')
            );
          }
        }
        
        // Apply rating filter last
        const finalResults = filteredPlaces.filter(place => place.rating >= (filters?.minRating || 0));
        console.log(`Final results count: ${finalResults.length}`);
        
        return finalResults;
      } catch (error) {
        console.error("Error fetching places:", error);
        throw error;
      }
    },
    enabled: enabled && !locationLoading && !!position,
    staleTime: 0, // Always consider data stale to ensure fresh data
    gcTime: 1000, // Reduce cache time to 1 second for quick invalidation
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Force refetch when location changes
  useEffect(() => {
    if (locationChangeCounter > 0 && position && !locationLoading) {
      console.log(`Location changed (counter: ${locationChangeCounter}), forcing immediate refetch...`);
      
      // Short timeout to ensure state updates have settled
      setTimeout(() => {
        console.log("Invalidating query cache and refetching");
        queryClient.invalidateQueries({ queryKey: ['places'] });
        query.refetch();
      }, 100);
    }
  }, [locationChangeCounter, position, locationLoading, queryClient, query]);

  // Additional debugging
  useEffect(() => {
    if (query.isFetching) {
      console.log("Query is fetching with position:", position, "counter:", locationChangeCounter);
    }
    if (query.data) {
      console.log(`Query returned ${query.data.length} places`);
    }
    if (query.isError) {
      console.error("Query error:", query.error);
    }
  }, [query.isFetching, query.isError, query.data, query.error, position, locationChangeCounter]);

  return query;
}
