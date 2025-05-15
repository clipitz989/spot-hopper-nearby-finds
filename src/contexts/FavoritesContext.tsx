
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PointOfInterest } from '../types';
import { toast } from '@/hooks/use-toast';

interface FavoritesContextType {
  favorites: PointOfInterest[];
  addFavorite: (poi: PointOfInterest) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<PointOfInterest[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to parse favorites from localStorage', error);
      }
    }
  }, []);

  // Save favorites to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (poi: PointOfInterest) => {
    setFavorites(prev => {
      if (prev.some(item => item.id === poi.id)) return prev;
      toast({
        title: "Added to Favorites",
        description: `${poi.name} has been added to your favorites`,
      });
      return [...prev, poi];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      const newFavorites = prev.filter(item => item.id !== id);
      if (itemToRemove) {
        toast({
          title: "Removed from Favorites",
          description: `${itemToRemove.name} has been removed from your favorites`,
        });
      }
      return newFavorites;
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
