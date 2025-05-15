
import { useQuery } from "@tanstack/react-query";
import { fetchPlaces, FoursquareSearchParams } from "../services/foursquareService";
import { PointOfInterest, Filter } from "../types";
import { useLocation } from "./useLocation";

interface UsePlacesQueryOptions {
  enabled?: boolean;
  filters?: Filter;
}

export function usePlacesQuery(options: UsePlacesQueryOptions = {}) {
  const { position, loading: locationLoading } = useLocation();
  const { filters, enabled = true } = options;
  
  return useQuery({
    queryKey: ['places', position, filters],
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
      
      // Add category filter if specified
      if (filters?.selectedCategories && filters.selectedCategories.length > 0) {
        // Map our app categories to Foursquare category IDs
        // This is a simplified approach - in a real app you'd want to map to actual Foursquare category IDs
        params.categories = filters.selectedCategories.join(',');
      }
      
      return fetchPlaces(params);
    },
    enabled: enabled && !locationLoading && !!position,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
