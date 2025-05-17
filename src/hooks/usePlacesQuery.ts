import { useQuery } from "@tanstack/react-query";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect, useRef } from "react";
import { fetchPlaces, FoursquareSearchParams, mapCategoriesToFoursquare } from "../services/foursquareService";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading, customLocation, locationChangeCounter } = useLocation();
  const { filters, enabled = true } = options;
  const previousPositionRef = useRef<string | null>(null);
  
  // Create a position string to detect real position changes
  const positionString = position ? `${position.latitude},${position.longitude}` : null;
  
  // Track whether this is a new position or just a re-render
  const isNewPosition = positionString !== previousPositionRef.current;
  
  // Update the previous position ref
  useEffect(() => {
    previousPositionRef.current = positionString;
  }, [positionString]);
  
  return useQuery<PointOfInterest[], Error>({
    queryKey: ['places', positionString, filters],
    queryFn: async () => {
      if (!position) {
        throw new Error('Location not available');
      }
      
      const searchParams: FoursquareSearchParams = {
        ll: `${position.latitude},${position.longitude}`,
        radius: filters?.maxDistance ? filters.maxDistance * 1000 : 10000, // Convert km to meters
        open_now: filters?.openNow,
        sort: "DISTANCE", // Default sort by distance
        limit: 50 // Reasonable limit for initial results
      };
      
      // Add category filter if selected
      if (filters?.selectedCategories?.length) {
        searchParams.categories = mapCategoriesToFoursquare(filters.selectedCategories);
      }
      
      const places = await fetchPlaces(searchParams);
      
      // Client-side filtering for minimum rating
      return places.filter(place => place.rating >= (filters?.minRating || 0));
    },
    enabled: enabled && !locationLoading && !!position,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });
}
