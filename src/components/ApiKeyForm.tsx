
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { getFoursquareApiKey, setFoursquareApiKey } from '../services/foursquareService';

interface ApiKeyFormProps {
  onComplete: () => void;
}

export function ApiKeyForm({ onComplete }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const savedKey = getFoursquareApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setIsSubmitting(true);
      setFoursquareApiKey(apiKey.trim());
      setTimeout(() => {
        setIsSubmitting(false);
        onComplete();
      }, 500);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Foursquare API Key</CardTitle>
        <CardDescription>
          Enter your Foursquare Places API key to fetch nearby places.
          You can get a free API key from the Foursquare Developer Dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter Foursquare API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={!apiKey.trim() || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save API Key'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            <a 
              href="https://developer.foursquare.com/docs/places-api-getting-started" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Learn how to get an API key
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
