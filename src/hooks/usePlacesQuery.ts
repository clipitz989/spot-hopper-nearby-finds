import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  console.log('usePlacesQuery render - position:', position, 'counter:', locationChangeCounter);

  // Force query invalidation when location changes
  useEffect(() => {
    if (locationChangeCounter > 0) {
      console.log('Location changed, invalidating places query...');
      queryClient.invalidateQueries({ queryKey: ['places'] });
    }
  }, [locationChangeCounter, queryClient]);

  const query = useQuery({
    queryKey: ['places', position?.latitude, position?.longitude, filters],
    queryFn: async () => {
      console.log('Places query function executing with position:', position);
      
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

      console.log('Fetching places with params:', params);
      
      try {
        const places = await fetchPlaces(params);
        console.log('Fetched places:', places.length);
        
        // Filter by minimum rating on the client side since Google Places API
        // doesn't support minimum rating filter
        const filteredPlaces = places.filter(place => place.rating >= (filters?.minRating || 0));
        console.log('Filtered places:', filteredPlaces.length);
        
        return filteredPlaces;
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

  // Log query state changes
  useEffect(() => {
    console.log('Query state:', {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error,
      dataLength: query.data?.length
    });
  }, [query.isLoading, query.isFetching, query.isError, query.error, query.data]);

  return query;
}
