
import { useState, useEffect } from 'react';
import { MapPin, Search, Locate } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useLocation } from '../hooks/useLocation';

export function LocationSearch() {
  const { searchLocation, getCurrentLocation, customLocation, loading, position } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchLocation(searchQuery.trim());
      console.log("Searching for location:", searchQuery.trim());
    }
  };

  // Update the search box with the current location name when it changes
  useEffect(() => {
    if (customLocation) {
      setSearchQuery(customLocation);
    }
  }, [customLocation]);
  
  return (
    <div className="w-full flex items-center gap-2">
      <form onSubmit={handleSearch} className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter city, state, or zip code"
          className="pl-9 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
        />
        {customLocation && !loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 inline mr-1" />
            {customLocation}
          </div>
        )}
      </form>
      <Button 
        type="button"
        size="sm"
        variant="outline"
        onClick={() => getCurrentLocation()}
        disabled={loading}
        title="Use your current location"
      >
        <Locate className="h-4 w-4 mr-2" />
        Near Me
      </Button>
    </div>
  );
}
