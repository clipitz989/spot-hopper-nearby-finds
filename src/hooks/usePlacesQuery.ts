import { useQuery } from "@tanstack/react-query";
import { fetchPlaces, GoogleSearchParams, mapCategoriesToGoogle } from "../services/googlePlacesService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect, useRef } from "react";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading, customLocation, locationChangeCounter } = useLocation();
  const { enabled = true, filters } = options;
  
  const query = useQuery({
    queryKey: ['places', position, filters],
    queryFn: async () => {
      if (!position) {
        return [];
      }
      
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
      
      console.log("Fetching places with params:", params);
      
      try {
        const places = await fetchPlaces(params);
        
        // Filter by minimum rating on the client side since Google Places API
        // doesn't support minimum rating filter
        return places.filter(place => place.rating >= (filters?.minRating || 0));
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

  return query;
}
