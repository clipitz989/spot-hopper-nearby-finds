
import { useQuery } from "@tanstack/react-query";
import { fetchPlaces, FoursquareSearchParams, mapCategoriesToFoursquare } from "../services/foursquareService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect, useRef } from "react";

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
  
  // Track whether this is a new position
  const isNewPosition = positionString !== previousPositionRef.current;
  
  // Update the ref when position changes
  useEffect(() => {
    if (positionString) {
      previousPositionRef.current = positionString;
    }
  }, [positionString]);
  
  const query = useQuery({
    queryKey: ['places', positionString, filters, locationChangeCounter],
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
      
      try {
        const places = await fetchPlaces(params);
        
        // Ensure we're returning consistent data for ratings and price ranges
        return places.map(place => ({
          ...place,
          // Ensure rating is fixed for this fetch
          rating: place.rating,
          // Ensure priceRange is fixed for this fetch
          priceRange: place.priceRange
        }));
      } catch (error) {
        console.error("Error fetching places:", error);
        throw error;
      }
    },
    enabled: enabled && !locationLoading && !!position,
    staleTime: Infinity, // Keep the data until explicitly invalidated
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Force refetch when location counter changes
  useEffect(() => {
    if (locationChangeCounter > 0 && query.fetchStatus !== 'fetching' && position) {
      console.log(`Location change detected (counter: ${locationChangeCounter}), refetching places...`);
      query.refetch();
    }
  }, [locationChangeCounter, position, query]);

  // Force refetch for new positions
  useEffect(() => {
    if (isNewPosition && position && !locationLoading) {
      console.log("New position detected, refetching...");
      query.refetch();
    }
  }, [isNewPosition, position, locationLoading, query]);

  return query;
}
