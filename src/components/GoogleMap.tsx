import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Navigation, Locate, AlertCircle } from 'lucide-react';
import { CatSighting } from '@/hooks/useCats';
import { loadGoogleMaps, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_STYLES } from '@/lib/google-maps';

interface GoogleMapProps {
  onAddCat: (lat: number, lng: number) => void;
  catSightings: CatSighting[];
  loading: boolean;
}

export const GoogleMap = ({ onAddCat, catSightings, loading }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [selectedSighting, setSelectedSighting] = useState<CatSighting | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        setMapError(null);
        const google = await loadGoogleMaps();
        
        if (mapRef.current && google) {
          const map = new google.maps.Map(mapRef.current, {
            center: DEFAULT_MAP_CENTER,
            zoom: DEFAULT_MAP_ZOOM,
            styles: MAP_STYLES,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: true,
            gestureHandling: 'greedy',
            clickableIcons: false,
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);

          // Add click listener for placing pins
          map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onAddCat(lat, lng);
            }
          });

          // Get user location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLatLng = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                setUserLocation(userLatLng);
                
                // Center map on user location if it's the first load
                if (!mapInstanceRef.current?.getBounds()) {
                  map.setCenter(userLatLng);
                  map.setZoom(15);
                }
              },
              (error) => {
                console.log('Geolocation error:', error);
                // Don't show error to user, just log it
              }
            );
          }
        }
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setMapError(error instanceof Error ? error.message : 'Failed to load Google Maps');
      }
    };

    initMap();
  }, [onAddCat]);

  // Update markers when cat sightings change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers.clear();

    // Add new markers for each cat sighting
    catSightings.forEach((sighting) => {
      const marker = new google.maps.Marker({
        position: { lat: sighting.latitude, lng: sighting.longitude },
        map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <path d="M16 8C18.2091 8 20 9.79086 20 12C20 14.2091 18.2091 16 16 16C13.7909 16 12 14.2091 12 12C12 9.79086 13.7909 16 16 16C16 18.2091 18.2091 20 20 20C18.2091 20 16 18.2091 16 16C13.7909 20 12 18.2091 12 16C12 18.2091 13.7909 16 16 16" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        title: sighting.cats?.name || 'Unknown Cat',
        animation: google.maps.Animation.DROP,
      });

      // Add click listener to marker
      marker.addListener('click', () => {
        setSelectedSighting(sighting);
      });

      // Store marker reference
      markers.set(sighting.id, marker);
    });
  }, [catSightings, mapLoaded]);

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(15);
    }
  }, [userLocation]);

  // Center map on selected sighting
  const centerOnSighting = useCallback((sighting: CatSighting) => {
    if (mapInstanceRef.current) {
      const position = { lat: sighting.latitude, lng: sighting.longitude };
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(16);
    }
  }, []);

  // Show error state
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="bg-destructive text-destructive-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-destructive">Map Loading Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {mapError}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (!mapLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Google Maps container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
      />

      {/* Loading indicator overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg">Loading cats...</div>
          </div>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 left-4 space-y-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="shadow-lg bg-background/90 backdrop-blur-sm"
          onClick={centerOnUserLocation}
          disabled={!userLocation}
          title="Center on my location"
        >
          <Locate className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="shadow-lg bg-background/90 backdrop-blur-sm"
          title="Navigation"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Floating add button */}
      <div className="absolute bottom-4 right-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full shadow-lg bg-background/90 backdrop-blur-sm"
          title="Click on map to add cat"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 max-w-xs">
        <Card className="shadow-lg bg-background/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              How to use
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Click anywhere on the map to place a pin and add a cat sighting. 
              Click on existing markers to view cat details.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selected sighting details */}
      {selectedSighting && (
        <Card className="absolute bottom-4 left-4 w-64 shadow-lg bg-background/95 backdrop-blur-sm">
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
                Center
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
