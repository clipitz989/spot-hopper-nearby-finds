
import { useState, useEffect } from 'react';
import { useLocation } from "../hooks/useLocation";
import { mockPOIs } from "../data/mockData";
import { PointOfInterest, Filter } from "../types";
import { PlaceCard } from "../components/PlaceCard";
import { FilterBar } from "../components/FilterBar";
import { PlaceDetails } from "../components/PlaceDetails";

export default function Home() {
  const { position, loading } = useLocation();
  const [places, setPlaces] = useState<PointOfInterest[]>(mockPOIs);
  const [filteredPlaces, setFilteredPlaces] = useState<PointOfInterest[]>(mockPOIs);
  const [selectedPlace, setSelectedPlace] = useState<PointOfInterest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<Filter>({
    openNow: false,
    minRating: 0,
    maxDistance: 10, // default 10 km radius
    priceRange: [1, 4],
    selectedCategories: []
  });

  // Apply filters whenever filters or places change
  useEffect(() => {
    let result = places;
    
    // Filter by open now
    if (filters.openNow) {
      result = result.filter(place => place.openNow);
    }
    
    // Filter by rating
    if (filters.minRating > 0) {
      result = result.filter(place => place.rating >= filters.minRating);
    }
    
    // Filter by distance (convert km to m)
    const maxDistanceMeters = filters.maxDistance * 1000;
    result = result.filter(place => 
      place.distance === undefined || place.distance <= maxDistanceMeters
    );
    
    // Filter by price range
    result = result.filter(place => 
      place.priceRange === undefined || 
      (place.priceRange >= filters.priceRange[0] && 
       place.priceRange <= filters.priceRange[1])
    );
    
    // Filter by categories
    if (filters.selectedCategories.length > 0) {
      result = result.filter(place => 
        filters.selectedCategories.includes(place.category)
      );
    }
    
    setFilteredPlaces(result);
  }, [filters, places]);

  const handleOpenDetails = (place: PointOfInterest) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  return (
    <div className="pb-16 min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <h1 className="text-2xl font-bold text-center">Nearby Finds</h1>
      </header>
      
      <FilterBar filters={filters} onFilterChange={setFilters} />
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Detecting your location...</p>
        </div>
      ) : (
        <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                onClick={() => handleOpenDetails(place)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p>No places match your current filters.</p>
            </div>
          )}
        </div>
      )}
      
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
