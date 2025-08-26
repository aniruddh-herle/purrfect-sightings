import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, Camera } from "lucide-react";

interface CatSpot {
  id: string;
  lat: number;
  lng: number;
  name: string;
  image?: string;
  timestamp: Date;
}

interface MapViewProps {
  onAddCat: (lat: number, lng: number) => void;
  catSpots: CatSpot[];
}

export const MapView = ({ onAddCat, catSpots }: MapViewProps) => {
  const [selectedSpot, setSelectedSpot] = useState<CatSpot | null>(null);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click coordinates to lat/lng (simplified for demo)
    const lat = 40.7128 + (y - rect.height / 2) * 0.01 / rect.height;
    const lng = -74.0060 + (x - rect.width / 2) * 0.01 / rect.width;
    
    onAddCat(lat, lng);
  }, [onAddCat]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-secondary to-muted rounded-lg overflow-hidden">
      {/* Simplified map interface - in production, integrate with Google Maps */}
      <div 
        className="w-full h-full cursor-crosshair relative"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      >
        {/* Map pins for cat spots */}
        {catSpots.map((spot) => (
          <div
            key={spot.id}
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer"
            style={{
              left: `${50 + (spot.lng + 74.0060) * 100}%`,
              top: `${50 + (spot.lat - 40.7128) * 100}%`
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSpot(spot);
            }}
          >
            <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-warm hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        ))}
        
        {/* Floating add button */}
        <div className="absolute bottom-4 right-4">
          <Button variant="fab" size="fab">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Map controls */}
        <div className="absolute top-4 left-4 space-y-2">
          <Button variant="map" size="icon">
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected spot info */}
      {selectedSpot && (
        <Card className="absolute bottom-4 left-4 right-16 p-4 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">{selectedSpot.name}</h3>
              <p className="text-sm text-muted-foreground">
                Spotted {selectedSpot.timestamp.toLocaleDateString()}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedSpot(null)}
            >
              ×
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};