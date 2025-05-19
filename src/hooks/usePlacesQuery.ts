
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
        
        // Extract relevant keywords from the natural query
        // This is a simple implementation - could be made more sophisticated
        const naturalQueryLower = naturalQuery.toLowerCase();
        
        // Map intent words to categories
        if (
          naturalQueryLower.includes("eat") || 
          naturalQueryLower.includes("food") || 
          naturalQueryLower.includes("restaurant") ||
          naturalQueryLower.includes("dinner") ||
          naturalQueryLower.includes("lunch") ||
          naturalQueryLower.includes("breakfast")
        ) {
          params.type = "restaurant";
        } else if (
          naturalQueryLower.includes("drink") ||
          naturalQueryLower.includes("bar") ||
          naturalQueryLower.includes("pub") ||
          naturalQueryLower.includes("beer") ||
          naturalQueryLower.includes("wine") ||
          naturalQueryLower.includes("cocktail")
        ) {
          params.type = "bar";
        } else if (
          naturalQueryLower.includes("see") ||
          naturalQueryLower.includes("visit") ||
          naturalQueryLower.includes("tour") ||
          naturalQueryLower.includes("museum") ||
          naturalQueryLower.includes("attraction")
        ) {
          params.type = "tourist_attraction";
        } else if (
          naturalQueryLower.includes("shop") ||
          naturalQueryLower.includes("buy") ||
          naturalQueryLower.includes("purchase") ||
          naturalQueryLower.includes("mall")
        ) {
          params.type = "shopping_mall";
        }
        
        // Extract keywords by removing intent words
        const intentWords = ["i", "would", "like", "to", "want", "find", "eat", "drink", 
                            "visit", "see", "go", "shop", "buy", "near", "me", "nearby", 
                            "some", "a", "an", "the"];
        
        const keywords = naturalQueryLower
          .split(" ")
          .filter(word => !intentWords.includes(word) && word.length > 2)
          .join(" ");
        
        if (keywords) {
          params.keyword = keywords;
          console.log("Extracted keywords:", keywords);
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
        
        // Filter by minimum rating on the client side since Google Places API
        // doesn't support minimum rating filter
        return places.filter(place => place.rating >= (filters?.minRating || 0));
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
