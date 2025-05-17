
import { useQuery } from "@tanstack/react-query";
import { fetchPlaces, FoursquareSearchParams, mapCategoriesToFoursquare } from "../services/foursquareService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect } from "react";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading, customLocation, locationChangeCounter } = useLocation();
  const { filters, enabled = true } = options;
  
  const query = useQuery({
    queryKey: ['places', position, filters, customLocation, locationChangeCounter],
    queryFn: async () => {
      if (!position) {
        return [];
      }
      
      const params: FoursquareSearchParams = {
        ll: `${position.latitude},${position.longitude}`,
        radius: filters?.maxDistance ? filters.maxDistance * 1000 : 10000, // Convert km to meters
        limit: 50,
        open_now: filters?.openNow,
      };
      
      // Add category filter if specified using the mapping function
      if (filters?.selectedCategories && filters.selectedCategories.length > 0) {
        const mappedCategories = mapCategoriesToFoursquare(filters.selectedCategories);
        if (mappedCategories) {
          params.categories = mappedCategories;
        }
      }
      
      console.log("Fetching places with params:", params);
      console.log("Current position:", position);
      console.log("Location counter:", locationChangeCounter);
      
      return fetchPlaces(params);
    },
    enabled: enabled && !locationLoading && !!position,
    // Force refetch when location changes
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 0, // Don't cache results to ensure fresh data on location changes
  });

  // Explicitly refetch when location changes
  useEffect(() => {
    if (locationChangeCounter > 0 && position && !locationLoading) {
      console.log("Location change detected, refetching places...");
      query.refetch();
    }
  }, [locationChangeCounter, position, locationLoading, query]);

  return query;
}
