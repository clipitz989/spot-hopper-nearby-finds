import { Clock } from "lucide-react";

interface OpeningHoursProps {
  openNow: boolean;
  hours?: string[];
}

export function OpeningHours({ openNow, hours }: OpeningHoursProps) {
  return (
    <div className="flex items-start gap-3">
      <Clock className="text-muted-foreground mt-1" size={18} />
      <div>
        <p className="font-medium">Opening Hours</p>
        <p className={`text-sm ${openNow ? 'text-green-600' : 'text-red-600'} font-medium`}>
          {openNow ? 'Open now' : 'Closed'}
        </p>
        {hours && hours.length > 0 && (
          <div className="mt-1 space-y-1">
            {hours.map((hour, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {hour}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 