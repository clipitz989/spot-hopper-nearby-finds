
import { MapPin, Utensils, LandPlot, Ticket } from "lucide-react";

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size = 20, className = "" }: CategoryIconProps) {
  switch (category.toLowerCase()) {
    case 'food':
      return <Utensils size={size} className={className} />;
    case 'attractions':
      return <LandPlot size={size} className={className} />;
    case 'activities':
      return <Ticket size={size} className={className} />;
    default:
      return <MapPin size={size} className={className} />;
  }
}
