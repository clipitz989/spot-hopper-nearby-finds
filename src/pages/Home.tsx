import { useState, useEffect } from 'react';
import { useLocation } from "../hooks/useLocation";
import { PointOfInterest, Filter } from "../types";
import { PlaceCard } from "../components/PlaceCard";
import { FilterBar } from "../components/FilterBar";
import { PlaceDetails } from "../components/PlaceDetails";
import { usePlacesQuery } from "../hooks/usePlacesQuery";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearch } from "../components/LocationSearch";
import { ApiKeyForm } from "../components/ApiKeyForm";
import { getFoursquareApiKey } from "../services/foursquareService";

export default function Home() {
  const { position, loading: locationLoading, locationChangeCounter } = useLocation();
  const [selectedPlace, setSelectedPlace] = useState<PointOfInterest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(!getFoursquareApiKey());
  const [filters, setFilters] = useState<Filter>({
    openNow: false,
    minRating: 0,
    maxDistance: 10, // default 10 km radius
    priceRange: [1, 4],
    selectedCategories: []
  });

  const { 
    data: places = [],
    isLoading: placesLoading,
    isError,
    error,
    refetch
  } = usePlacesQuery({
    filters,
    enabled: !showApiKeyForm
  });

  // Force refetch when location changes
  useEffect(() => {
    if (locationChangeCounter > 0 && position && !showApiKeyForm) {
      console.log(`Location changed (counter: ${locationChangeCounter}), forcing refetch...`);
      // Add a small delay to ensure all state updates have completed
      const timer = setTimeout(() => {
        refetch();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [locationChangeCounter, position, refetch, showApiKeyForm]);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [isError, error]);

  const handleOpenDetails = (place: PointOfInterest) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedPlace(null);
  };

  if (showApiKeyForm) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <ApiKeyForm onComplete={() => setShowApiKeyForm(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <h1 className="text-2xl font-bold text-center">Nearby Finds!</h1>
      </header>
      
      <div className="container max-w-7xl mx-auto">
        <div className="p-4">
          <LocationSearch />
        </div>
        
        <FilterBar filters={filters} onFilterChange={setFilters} />
        
        <div className="relative min-h-[200px]">
          {(locationLoading || placesLoading) ? (
            <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] rounded-xl" />
              ))}
            </div>
          ) : places.length > 0 ? (
            <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {places
                .filter(place => place.rating >= filters.minRating)
                .map(place => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onClick={() => handleOpenDetails(place)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No places found nearby. Try adjusting your filters or location.
            </div>
          )}
        </div>
      </div>
      
      {selectedPlace && (
        <PlaceDetails
          place={selectedPlace}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
