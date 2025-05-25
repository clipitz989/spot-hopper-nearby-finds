import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlaces, FoursquareSearchParams, mapCategoriesToFoursquare, clearPlacesCache } from "../services/foursquareService";
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
      
      // Only clear cache when location changes significantly
      if (locationChangeCounter > 0) {
        clearPlacesCache();
      }
      
      const params: FoursquareSearchParams = {
        location: `${position.latitude},${position.longitude}`,
        radius: filters?.maxDistance ? filters.maxDistance * 1000 : 10000,
        openNow: filters?.openNow,
      };
      
      // Process natural language query if provided
      if (naturalQuery) {
        console.log("Using natural language query:", naturalQuery);
        params.query = naturalQuery;
      } else if (filters?.selectedCategories && filters.selectedCategories.length > 0) {
        params.categories = mapCategoriesToFoursquare(filters.selectedCategories);
      }
      
      // Add price range filter
      if (filters?.priceRange) {
        params.minPrice = filters.priceRange[0];
        params.maxPrice = filters.priceRange[1];
      }
      
      try {
        const places = await fetchPlaces(params);
        console.log(`Successfully fetched ${places.length} places`);
        return places;
      } catch (error) {
        console.error("Error fetching places:", error);
        throw error;
      }
    },
    enabled: enabled && !locationLoading && !!position,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Only refetch when location changes significantly
  useEffect(() => {
    if (locationChangeCounter > 0 && position && !locationLoading) {
      console.log(`Location changed (counter: ${locationChangeCounter}), forcing refetch...`);
      queryClient.invalidateQueries({ queryKey: ['places'] });
    }
  }, [locationChangeCounter, position, locationLoading, queryClient]);

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
