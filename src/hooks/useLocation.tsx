
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface Position {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customLocation, setCustomLocation] = useState<string | null>(null);
  const [locationChangeCounter, setLocationChangeCounter] = useState(0);

  // Get current location using browser geolocation
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setCustomLocation(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        console.log("Setting current position:", newPosition);
        setPosition(newPosition);
        setLoading(false);
        
        // Increment the counter AFTER state is updated
        setLocationChangeCounter(prev => prev + 1);
        
        toast({
          title: "Location Updated",
          description: "Using your current location",
        });
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        toast({
          title: "Location Error",
          description: "Unable to retrieve your location",
          variant: "destructive",
        });
      }
    );
  }, []);

  // Search for a location by name using Nominatim API (OpenStreetMap)
  const searchLocation = useCallback(async (query: string) => {
    if (!query) return;
    
    setLoading(true);
    setCustomLocation(query);
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        
        const newPosition = {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        };
        
        console.log("Found location for search:", query, newPosition);
        
        // Update position first
        setPosition(newPosition);
        setLoading(false);
        
        // Then increment the counter separately
        setLocationChangeCounter(prev => prev + 1);
        
        toast({
          title: "Location Updated",
          description: `Showing results for ${query}`,
        });
      } else {
        setLoading(false);
        toast({
          title: "Location Error",
          description: `Could not find location: ${query}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
      setLoading(false);
      toast({
        title: "Location Error",
        description: "Error searching for location",
        variant: "destructive",
      });
    }
  }, []);

  // Initialize with the user's current location
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return { 
    position, 
    error, 
    loading, 
    customLocation,
    locationChangeCounter,
    getCurrentLocation,
    searchLocation
  };
}
