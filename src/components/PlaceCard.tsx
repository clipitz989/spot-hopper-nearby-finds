import { Heart, Star, Clock, DollarSign, Globe } from "lucide-react";
import { PointOfInterest } from "../types";
import { useFavorites } from "../contexts/FavoritesContext";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";

interface PlaceCardProps {
  place: PointOfInterest;
  onClick?: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(place.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(place.id);
  };

  return (
    <Card className="overflow-hidden cursor-pointer" onClick={onClick}>
      <CardHeader className="p-0">
        <div className="relative h-48">
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
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{place.name}</h3>
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{place.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {place.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {place.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {place.openNow !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{place.openNow ? "Open" : "Closed"}</span>
            </div>
          )}
          
          {place.priceRange && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{"$".repeat(place.priceRange)}</span>
            </div>
          )}
          
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
              <span>Website</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
