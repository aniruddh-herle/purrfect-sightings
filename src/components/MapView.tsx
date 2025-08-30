import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, Camera } from "lucide-react";
import { CatSighting } from "@/hooks/useCats";

interface MapViewProps {
  onAddCat: (lat: number, lng: number) => void;
  catSightings: CatSighting[];
  loading: boolean;
}

export const MapView = ({ onAddCat, catSightings, loading }: MapViewProps) => {
  const [selectedSighting, setSelectedSighting] = useState<CatSighting | null>(null);

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
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-lg">Loading cats...</div>
          </div>
        )}

        {/* Cat sightings */}
        {catSightings.map((sighting) => {
          const x = ((sighting.longitude + 74.0060) * 1000) % 100;
          const y = ((sighting.latitude - 40.7128) * 1000) % 100;
          
          return (
            <div
              key={sighting.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${Math.max(5, Math.min(95, x + 50))}%`,
                top: `${Math.max(5, Math.min(95, 50 - y))}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSighting(sighting);
              }}
            >
              <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          );
        })}
        
        {/* Floating add button */}
        <div className="absolute bottom-4 right-4">
          <Button variant="outline" size="icon" className="rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Map controls */}
        <div className="absolute top-4 left-4 space-y-2">
          <Button variant="outline" size="icon">
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected sighting details */}
      {selectedSighting && (
        <Card className="absolute top-4 right-4 w-64 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedSighting.cats?.name || 'Unknown Cat'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSighting.cats?.image_url && (
              <img 
                src={selectedSighting.cats.image_url} 
                alt={selectedSighting.cats.name}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
            )}
            <p className="text-sm text-muted-foreground mb-2">
              Spotted {new Date(selectedSighting.spotted_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Location: {selectedSighting.latitude.toFixed(4)}, {selectedSighting.longitude.toFixed(4)}
            </p>
            {selectedSighting.notes && (
              <p className="text-sm mb-2">{selectedSighting.notes}</p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => setSelectedSighting(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};