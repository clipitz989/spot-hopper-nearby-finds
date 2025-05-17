import { useQuery } from "@tanstack/react-query";
import { fetchPlaces, GoogleSearchParams, mapCategoriesToGoogle } from "../services/googlePlacesService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";
import { useEffect } from "react";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading, customLocation, locationChangeCounter } = useLocation();
  const { enabled = true, filters } = options;

  const query = useQuery({
    queryKey: ['places', position, filters, locationChangeCounter],
    queryFn: async () => {
      if (!position) {
        throw new Error('No location available');
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
    staleTime: 0, // Always refetch when query key changes
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
  });

  return query;
}
