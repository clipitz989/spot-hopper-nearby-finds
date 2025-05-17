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
    console.log('Getting current location...');
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
        
        console.log('Current location obtained:', newPosition);
        setPosition(newPosition);
        setLoading(false);
        setLocationChangeCounter(prev => {
          console.log('Incrementing location counter from', prev, 'to', prev + 1);
          return prev + 1;
        });
        
        toast({
          title: "Location Updated",
          description: "Using your current location",
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
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
    
    console.log('Searching for location:', query);
    setLoading(true);
    setCustomLocation(query);
    
    try {
      console.log('Fetching from Nominatim API...');
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Nominatim API response:', data);
      
      if (data && data.length > 0) {
        const location = data[0];
        const newPosition = {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        };
        
        console.log('Setting new position:', newPosition);
        
        // Update all state synchronously
        setPosition(newPosition);
        setError(null);
        setLoading(false);
        setLocationChangeCounter(prev => {
          console.log('Incrementing location counter from', prev, 'to', prev + 1);
          return prev + 1;
        });
        
        toast({
          title: "Location Updated",
          description: `Showing results for ${query}`,
        });
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error("Error searching location:", error);
      setError(error instanceof Error ? error.message : 'Error searching for location');
      setLoading(false);
      setPosition(null); // Clear position on error
      
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Error searching for location",
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
