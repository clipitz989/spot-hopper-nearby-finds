import { Heart, MapPin, Phone, Globe, Star } from "lucide-react";
import { PointOfInterest } from "../types";
import { useFavorites } from "../contexts/FavoritesContext";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { CategoryIcon } from "./CategoryIcon";

interface PlaceDetailsProps {
  place: PointOfInterest;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaceDetails({ place, isOpen, onClose }: PlaceDetailsProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorite = isFavorite(place.id);
  
  const handleFavoriteClick = () => {
    if (favorite) {
      removeFavorite(place.id);
    } else {
      addFavorite(place);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="relative h-60">
          <img 
            src={place.image} 
            alt={place.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full bg-white ${favorite ? 'text-red-500' : 'text-gray-400'}`}
              onClick={handleFavoriteClick}
            >
              <Heart className={favorite ? 'fill-current' : ''} size={18} />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">{place.name}</h2>
              <div className="flex items-center text-muted-foreground">
                <CategoryIcon category={place.category} size={16} />
                <span className="capitalize ml-4">{place.subcategory || place.category}</span>
                {place.priceRange && (
                  <span className="ml-4">{"$".repeat(place.priceRange)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center bg-primary/10 text-primary font-medium rounded px-3 py-1">
              <Star className="mr-1" size={16} />
              {place.rating} ({place.reviews})
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-muted-foreground mt-1" size={18} />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-muted-foreground">{place.location.address}</p>
                {place.distance !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {place.distance} miles away
                  </p>
                )}
              </div>
            </div>
            
            {place.contact?.phone && (
              <div className="flex items-start gap-3">
                <Phone className="text-muted-foreground mt-1" size={18} />
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${place.contact.phone}`} className="text-primary hover:underline">
                    {place.contact.phone}
                  </a>
                </div>
              </div>
            )}
            
            {place.contact?.website && (
              <div className="flex items-start gap-3">
                <Globe className="text-muted-foreground mt-1" size={18} />
                <div>
                  <p className="font-medium">Website</p>
                  <a 
                    href={place.contact.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {place.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button className="flex-1" asChild>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.location.latitude},${place.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            </Button>
            
            <Button 
              variant={favorite ? "outline" : "secondary"} 
              className={favorite ? "text-red-500" : ""}
              onClick={handleFavoriteClick}
            >
              <Heart className={`mr-2 ${favorite ? 'fill-current' : ''}`} size={16} />
              {favorite ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
