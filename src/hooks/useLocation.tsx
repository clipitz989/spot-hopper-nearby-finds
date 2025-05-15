
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface Position {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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

    const successHandler = (position: GeolocationPosition) => {
      setPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setLoading(false);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setError(error.message);
      setLoading(false);
      toast({
        title: "Location Error",
        description: "Unable to retrieve your location",
        variant: "destructive",
      });
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler);
  }, []);

  return { position, error, loading };
}
