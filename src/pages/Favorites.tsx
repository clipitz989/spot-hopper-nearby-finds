
import { useState } from 'react';
import { useFavorites } from "../contexts/FavoritesContext";
import { PlaceCard } from "../components/PlaceCard";
import { PlaceDetails } from "../components/PlaceDetails";
import { PointOfInterest } from '../types';

export default function Favorites() {
  const { favorites } = useFavorites();
  const [selectedPlace, setSelectedPlace] = useState<PointOfInterest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenDetails = (place: PointOfInterest) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <h1 className="text-2xl font-bold text-center">My Favorites</h1>
      </header>
      
      {favorites.length > 0 ? (
        <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => handleOpenDetails(place)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
          <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-4">
            Save your favorite places to find them easily later.
          </p>
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
