
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlaces, GoogleSearchParams, mapCategoriesToGoogle, clearPlacesCache } from "../services/googlePlacesService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect } from "react";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading, locationChangeCounter } = useLocation();
  const { enabled = true, filters } = options;
  const queryClient = useQueryClient();

  // Create query key with all dependencies that should trigger a refetch
  const queryKey = ['places', 
    position?.latitude, 
    position?.longitude, 
    filters, 
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
      
      // Add category filter if specified
      if (filters?.selectedCategories && filters.selectedCategories.length > 0) {
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
