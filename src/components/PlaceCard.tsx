import { Heart } from "lucide-react";
import { PointOfInterest } from "../types";
import { useFavorites } from "../contexts/FavoritesContext";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import React from "react";

interface PlaceCardProps {
  place: PointOfInterest;
  onClick: () => void;
}

export const PlaceCard = React.memo(({ place, onClick }: PlaceCardProps) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorite = isFavorite(place.id);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorite) {
      removeFavorite(place.id);
    } else {
      addFavorite(place);
    }
  };
  
  return (
    <Card 
      className="w-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-40">
        <img 
          src={place.image} 
          alt={place.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full bg-white ${favorite ? 'text-red-500' : 'text-gray-400'}`}
            onClick={handleFavoriteClick}
          >
            <Heart className={favorite ? 'fill-current' : ''} size={18} />
          </Button>
        </div>
        <div className="absolute top-2 left-2 bg-white rounded-full p-1">
          <CategoryIcon category={place.category} />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{place.name}</h3>
          <div className="flex items-center bg-primary/10 text-primary font-medium rounded px-2 py-1 text-sm">
            {place.rating.toFixed(1)} ★
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{place.location.address}</p>
        {place.distance !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            {(place.distance < 1000) 
              ? `${Math.round(place.distance)} m away` 
              : `${(place.distance / 1000).toFixed(1)} km away`}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex gap-1">
          {place.priceRange && (
            <span className="text-sm text-muted-foreground">
              {'$'.repeat(place.priceRange)}
            </span>
          )}
        </div>
        <span className={`text-xs font-medium ${place.openNow ? 'text-green-600' : 'text-red-600'}`}>
          {place.openNow ? 'Open now' : 'Closed'}
        </span>
      </CardFooter>
    </Card>
  );
});

PlaceCard.displayName = 'PlaceCard';
