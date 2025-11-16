import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Locate, AlertCircle } from 'lucide-react';
import { CatSighting } from '@/hooks/useCats';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface OpenStreetMapProps {
  onAddCat: (lat: number, lng: number) => void;
  catSightings: CatSighting[];
  loading: boolean;
}

export const OpenStreetMap = ({ onAddCat, catSightings, loading }: OpenStreetMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selectedSighting, setSelectedSighting] = useState<CatSighting | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      console.log('Initializing map...');
      
      // Create map with very basic configuration
      const map = L.map(mapRef.current, {
        center: [40.7128, -74.0060], // NYC as default
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      console.log('Map instance created');

      // Add OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });

      tileLayer.on('loading', () => {
        console.log('Tiles loading...');
      });

      tileLayer.on('load', () => {
        console.log('Tiles loaded successfully');
        setMapLoaded(true);
      });

      tileLayer.on('tileerror', (error) => {
        console.error('Tile loading error:', error);
      });

      tileLayer.addTo(map);

      mapInstanceRef.current = map;

      // Add click listener for placing pins
      map.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        onAddCat(lat, lng);
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
            
            // Center map on user location
            map.setView([userLatLng.lat, userLatLng.lng], 15);
            console.log('User location set:', userLatLng);
          },
          (error) => {
            console.log('Geolocation error:', error);
            // Keep default location and still set map as loaded
            setMapLoaded(true);
          }
        );
      } else {
        // No geolocation available, still mark as loaded
        setMapLoaded(true);
      }

      // Fallback: mark as loaded after 3 seconds even if tiles haven't confirmed loading
      setTimeout(() => {
        if (!mapLoaded) {
          console.log('Fallback: marking map as loaded');
          setMapLoaded(true);
        }
      }, 3000);

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to load the map. Please refresh the page.');
      setMapLoaded(true); // Set to true so error message shows
    }
  }, [onAddCat]);

  // Update markers when cat sightings change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers.clear();

    // Add new markers for each cat sighting
    catSightings.forEach((sighting) => {
      const marker = L.marker([sighting.latitude, sighting.longitude], {
        title: sighting.cats?.name || 'Unknown Cat',
      }).addTo(map);

      // Add click listener to marker
      marker.on('click', () => {
        setSelectedSighting(sighting);
      });

      // Store marker reference
      markers.set(sighting.id, marker);
    });
  }, [catSightings, mapLoaded]);

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation]);

  // Center map on selected sighting
  const centerOnSighting = useCallback((sighting: CatSighting) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([sighting.latitude, sighting.longitude], 16);
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
              Reload Page
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
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* OpenStreetMap container */}
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
