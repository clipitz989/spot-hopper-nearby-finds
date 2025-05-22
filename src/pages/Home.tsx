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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortOption = 'relevance' | 'rating' | 'distance';

export default function Home() {
  const { position, loading: locationLoading, locationChangeCounter } = useLocation();
  const [selectedPlace, setSelectedPlace] = useState<PointOfInterest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
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
    filters
  });

  // Force refetch when location changes
  useEffect(() => {
    if (locationChangeCounter > 0 && position) {
      console.log(`Location changed (counter: ${locationChangeCounter}), forcing refetch...`);
      // Add a small delay to ensure all state updates have completed
      const timer = setTimeout(() => {
        refetch();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [locationChangeCounter, position, refetch]);

  useEffect(() => {
    if (isError && error) {
      // More informative error message for category issues
      let errorMessage = error.toString();
      if (errorMessage.includes("400")) {
        errorMessage = "Invalid category selection or API request. Please try different filters.";
      }
      
      toast({
        title: "Error loading places",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isError, error]);

  const handleFilterChange = (newFilters: Filter) => {
    setFilters(newFilters);
    // Provide feedback when applying filters
    if (newFilters.selectedCategories.length > 0) {
      toast({
        title: "Applying filters",
        description: `Finding places${newFilters.selectedCategories.length > 0 ? ' in selected categories' : ''}`,
      });
    }
  };

  const handleOpenDetails = (place: PointOfInterest) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  const sortPlaces = (placesToSort: PointOfInterest[]) => {
    // First filter by minimum rating
    const filtered = placesToSort.filter(place => place.rating >= filters.minRating);
    
    // Then sort based on selected option
    const sorted = [...filtered];
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'distance':
        sorted.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
        break;
      default: // 'relevance'
        // Keep original order from API
        break;
    }
    
    return sorted;
  };

  // Log when position changes to help with debugging
  useEffect(() => {
    if (position) {
      console.log("Position updated in Home:", position);
    }
  }, [position]);

  const renderContent = () => {
    // Show loading state when detecting location or loading places
    if (locationLoading || placesLoading) {
      return (
        <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Show places
    const sortedPlaces = sortPlaces(places);
    
    return (
      <>
        <div className="px-4 py-2">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="distance">Closest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlaces.length > 0 ? (
            sortedPlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                onClick={() => handleOpenDetails(place)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p>No places match your current filters.</p>
              <button 
                className="mt-4 text-primary underline"
                onClick={() => refetch()}
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="pb-16 min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <h1 className="text-2xl font-bold text-center">Nearby Finds</h1>
      </header>
      
      <div className="px-4 pt-4 pb-2">
        <LocationSearch />
      </div>
      
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />
      
      {renderContent()}
      
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
