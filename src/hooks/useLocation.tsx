
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

  // Helper function to safely increment counter
  const incrementLocationCounter = useCallback(() => {
    setLocationChangeCounter(prevCounter => {
      const newCounter = prevCounter + 1;
      console.log(`Incrementing location counter from ${prevCounter} to ${newCounter}`);
      return newCounter;
    });
  }, []);

  // Get current location using browser geolocation
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setCustomLocation(null);
    
    console.log("Getting current location...");
    
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
        
        console.log("Current position obtained:", newPosition);
        
        // Update position state first
        setPosition(newPosition);
        setLoading(false);
        
        // Then increment counter to trigger data refresh
        incrementLocationCounter();
        
        toast({
          title: "Location Updated",
          description: "Using your current location",
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError(error.message);
        setLoading(false);
        toast({
          title: "Location Error",
          description: "Unable to retrieve your location",
          variant: "destructive",
        });
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [incrementLocationCounter]);

  // Search for a location by name using Nominatim API (OpenStreetMap)
  const searchLocation = useCallback(async (query: string) => {
    if (!query) return;
    
    setLoading(true);
    setCustomLocation(query);
    
    console.log("Searching for location:", query);
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        
        const newPosition = {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        };
        
        console.log("Found location:", query, newPosition);
        
        // Update position state first
        setPosition(newPosition);
        setLoading(false);
        
        // Then increment counter to trigger data refresh
        incrementLocationCounter();
        
        toast({
          title: "Location Updated",
          description: `Showing results for ${query}`,
        });
      } else {
        console.log("No location found for:", query);
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
  }, [incrementLocationCounter]);

  // Initialize with the user's current location
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Debug logs for position changes
  useEffect(() => {
    if (position) {
      console.log("Position state updated:", position);
    }
  }, [position]);

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
