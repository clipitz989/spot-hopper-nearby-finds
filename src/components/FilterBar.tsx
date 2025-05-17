import { useState } from "react";
import { Filter as FilterIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Filter } from "../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Slider } from "./ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterBarProps {
  filters: Filter;
  onFilterChange: (filters: Filter) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<Filter>(filters);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleOpenNowToggle = (checked: boolean) => {
    setLocalFilters(prev => ({ ...prev, openNow: checked }));
  };
  
  const handleRatingChange = (value: number[]) => {
    setLocalFilters(prev => ({ ...prev, minRating: value[0] }));
  };
  
  const handleDistanceChange = (value: number[]) => {
    setLocalFilters(prev => ({ ...prev, maxDistance: value[0] }));
  };
  
  const handlePriceRangeChange = (value: number[]) => {
    setLocalFilters(prev => ({ ...prev, priceRange: value }));
  };
  
  const handleCategoryToggle = (category: string) => {
    setLocalFilters(prev => {
      const currentCategories = prev.selectedCategories;
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];
      return { ...prev, selectedCategories: newCategories };
    });
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };
  
  return (
    <div className="w-full py-2 px-4 bg-background border-b sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <FilterIcon size={16} className="mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="open-now">Open Now</Label>
                    <Switch 
                      id="open-now"
                      checked={localFilters.openNow} 
                      onCheckedChange={handleOpenNowToggle}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Any</span>
                    <Slider 
                      defaultValue={[localFilters.minRating]} 
                      max={5} 
                      step={0.5} 
                      onValueChange={handleRatingChange}
                      className="w-[70%]"
                    />
                    <span className="text-sm text-muted-foreground">5 ★</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum Distance (km)</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nearby</span>
                    <Slider 
                      defaultValue={[localFilters.maxDistance]} 
                      max={20} 
                      step={1} 
                      onValueChange={handleDistanceChange}
                      className="w-[70%]"
                    />
                    <span className="text-sm text-muted-foreground">20km</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <Slider 
                    defaultValue={localFilters.priceRange} 
                    min={1} 
                    max={4} 
                    step={1} 
                    onValueChange={handlePriceRangeChange}
                  />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">$</span>
                    <span className="text-sm text-muted-foreground">$$</span>
                    <span className="text-sm text-muted-foreground">$$$</span>
                    <span className="text-sm text-muted-foreground">$$$$</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['food', 'attractions', 'activities'].map(category => (
                      <Button
                        key={category}
                        variant={localFilters.selectedCategories.includes(category) ? "default" : "outline"}
                        onClick={() => handleCategoryToggle(category)}
                        className="capitalize"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button className="w-full" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex gap-2">
            {['food', 'attractions', 'activities'].map(category => (
              <Button
                key={category}
                variant={filters.selectedCategories.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newCategories = filters.selectedCategories.includes(category)
                    ? filters.selectedCategories.filter(c => c !== category)
                    : [...filters.selectedCategories, category];
                  onFilterChange({...filters, selectedCategories: newCategories});
                }}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
