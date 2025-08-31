import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Navigation, Locate, Wifi, WifiOff } from 'lucide-react';
import { CatSighting } from '@/hooks/useCats';
import { toast } from '@/hooks/use-toast';

interface OfflineMapProps {
  onAddCat: (lat: number, lng: number) => void;
  catSightings: CatSighting[];
  loading: boolean;
  onRetryOnline: () => void;
}

export const OfflineMap = ({ onAddCat, catSightings, loading, onRetryOnline }: OfflineMapProps) => {
  const [selectedSighting, setSelectedSighting] = useState<CatSighting | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location for offline mode
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click coordinates to approximate lat/lng
    // This is a simplified conversion for demo purposes
    const centerLat = userLocation?.lat || 40.7128; // Default to NYC if no user location
    const centerLng = userLocation?.lng || -74.0060;
    
    // Convert pixel coordinates to lat/lng offset
    const latOffset = (y - rect.height / 2) * 0.01 / rect.height;
    const lngOffset = (x - rect.width / 2) * 0.01 / rect.width;
    
    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    
    onAddCat(lat, lng);
  }, [onAddCat, userLocation]);

  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      // In offline mode, we can't actually center the map
      // But we can show the user where they are
      toast({
        title: "Your Location",
        description: `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`,
      });
    } else {
      getCurrentLocation();
    }
  }, [userLocation]);

  const centerOnSighting = useCallback((sighting: CatSighting) => {
    // In offline mode, we can't actually center the map
    // But we can show the location
    toast({
      title: "Cat Location",
      description: `${sighting.latitude.toFixed(4)}, ${sighting.longitude.toFixed(4)}`,
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Offline map interface */}
      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted rounded-lg overflow-hidden">
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
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-lg">Loading cats...</div>
              </div>
            </div>
          )}

          {/* Cat sightings */}
          {catSightings.map((sighting) => {
            // Convert lat/lng to approximate pixel coordinates
            const centerLat = userLocation?.lat || 40.7128;
            const centerLng = userLocation?.lng || -74.0060;
            
            const latDiff = sighting.latitude - centerLat;
            const lngDiff = sighting.longitude - centerLng;
            
            const x = 50 + (lngDiff * 1000) % 100;
            const y = 50 - (latDiff * 1000) % 100;
            
            return (
              <div
                key={sighting.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${Math.max(5, Math.min(95, x))}%`,
                  top: `${Math.max(5, Math.min(95, y))}%`,
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
          
          {/* Map controls - only show user location button */}
          <div className="absolute top-4 left-4 space-y-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={centerOnUserLocation}
              title="Get my location"
            >
              <Locate className="w-4 h-4" />
            </Button>
          </div>

          {/* Offline indicator */}
          <div className="absolute top-4 right-4">
            <Card className="shadow-lg bg-background/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  Offline Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-2">
                  Maps are loading offline due to connection issues
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={onRetryOnline}
                >
                  <Wifi className="w-3 h-3 mr-1" />
                  Try Online
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 max-w-xs">
            <Card className="shadow-lg bg-background/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Offline Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Click anywhere on the grid to place a pin. This is a simplified offline view.
                  Try the "Try Online" button to load the full map.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Selected sighting details */}
      {selectedSighting && (
        <Card className="absolute top-20 right-4 w-64 shadow-lg bg-background/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="w-5 h-5" />
              {selectedSighting.cats?.name || 'Unknown Cat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => centerOnSighting(selectedSighting)}
              >
                <Navigation className="w-3 h-3 mr-1" />
                Show Location
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setSelectedSighting(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
