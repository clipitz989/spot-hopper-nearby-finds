
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useLocation } from "../hooks/useLocation";

interface NaturalSearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  activeQuery: string;
  onClear: () => void;
}

export function NaturalSearch({
  onSearch,
  isSearching,
  activeQuery,
  onClear,
}: NaturalSearchProps) {
  const [query, setQuery] = useState("");
  const { loading } = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full mb-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="I would like to..."
            className="pl-10 pr-20 py-6 text-base rounded-full border-2 border-primary/20 focus-visible:border-primary/40 animate-fade-in"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || isSearching}
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-4 py-1 hover:bg-primary/90"
            disabled={!query.trim() || loading || isSearching}
          >
            Find
          </Button>
        </div>
      </form>
      
      {activeQuery && (
        <div className="flex items-center justify-between mt-2 px-3 py-1.5 bg-primary/10 rounded-full animate-fade-in">
          <p className="text-sm">
            <span className="font-medium">Searching for:</span> {activeQuery}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 hover:bg-primary/20"
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
