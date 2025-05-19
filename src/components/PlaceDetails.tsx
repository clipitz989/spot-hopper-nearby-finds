
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl">
        <div className="relative h-72">
          <img 
            src={place.image} 
            alt={place.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-1">{place.name}</h2>
            <div className="flex items-center text-white/80 gap-2">
              <CategoryIcon category={place.category} size={16} className="opacity-90" />
              <span className="capitalize text-sm">{place.subcategory || place.category}</span>
              {place.priceRange && (
                <span className="ml-2 font-medium">{"$".repeat(place.priceRange)}</span>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full backdrop-blur-md bg-white/20 border-white/30 ${favorite ? 'text-red-500' : 'text-white'}`}
              onClick={handleFavoriteClick}
            >
              <Heart className={favorite ? 'fill-current' : ''} size={18} />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary font-medium rounded-full px-3 py-1.5">
              <Star className="fill-primary text-primary" size={16} />
              <span>{place.rating} <span className="text-primary/60 text-sm">({place.reviews})</span></span>
            </div>
            
            <Button 
              variant={favorite ? "outline" : "secondary"} 
              className={`rounded-full px-4 ${favorite ? 'text-red-500 border-red-200' : ''}`}
              onClick={handleFavoriteClick}
            >
              <Heart className={`mr-2 ${favorite ? 'fill-current' : ''}`} size={16} />
              {favorite ? 'Saved' : 'Save'}
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-muted-foreground mt-1" size={18} />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-muted-foreground">{place.location.address}</p>
                {place.distance !== undefined && (
                  <p className="text-sm text-muted-foreground/80 mt-1">
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
          
          <div className="mt-8">
            <Button className="w-full rounded-full" size="lg" asChild>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.location.latitude},${place.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
