import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { GOOGLE_API_KEY } from '../services/googlePlacesService';

export function ApiKeyForm() {
  const [apiKey, setApiKey] = useState(GOOGLE_API_KEY || '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Note: In a real application, you would want to validate and securely store the API key
    // For this demo, we're just showing the form UI
    setIsSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Google Places API Key</CardTitle>
          <CardDescription>
            Enter your Google Places API key to fetch nearby places.
            You can get an API key from the Google Cloud Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Google Places API Key"
              className="w-full"
            />
            <Button type="submit" className="w-full">
              {isSubmitted ? "API Key Saved!" : "Save API Key"}
            </Button>
            <a
              href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Learn how to get an API key →
            </a>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
