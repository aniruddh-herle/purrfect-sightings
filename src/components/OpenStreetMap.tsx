import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Locate, AlertCircle, X } from 'lucide-react';
import { CatSighting } from '@/hooks/useCats';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack/vite
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

/**
 * CatMapView Component
 * 
 * A robust OpenStreetMap integration using Leaflet for the Cat Spotter app.
 * Allows users to view existing cat sightings and place new pins to add cats.
 * 
 * Features:
 * - Displays all cat sightings as interactive markers
 * - Allows users to click/tap anywhere to add new cat sightings
 * - Centers on user's location if permission granted
 * - Mobile-friendly with touch event support
 * - Comprehensive error handling and loading states
 */
export const OpenStreetMap = ({ onAddCat, catSightings, loading }: OpenStreetMapProps) => {
  // Refs for map instance and markers
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  
  // Component state
  const [selectedSighting, setSelectedSighting] = useState<CatSighting | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize the map instance
   * This runs once when the component mounts
   */
  useEffect(() => {
    // Prevent re-initialization
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('[Map] Starting initialization...');
    setIsInitializing(true);

    try {
      // Default center (New York City) - will be overridden if geolocation works
      const defaultCenter: [number, number] = [40.7128, -74.0060];
      
      // Create the Leaflet map instance
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
        minZoom: 3,
        maxZoom: 19,
      });

      console.log('[Map] Map instance created');

      // Add OpenStreetMap tile layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3,
      });

      // Track tile loading
      let tilesLoaded = false;
      let loadTimeout: NodeJS.Timeout;

      tileLayer.on('loading', () => {
        console.log('[Map] Tiles loading...');
      });

      tileLayer.on('load', () => {
        console.log('[Map] Tiles loaded successfully');
        tilesLoaded = true;
        clearTimeout(loadTimeout);
        setMapReady(true);
        setIsInitializing(false);
      });

      tileLayer.on('tileerror', (error) => {
        console.error('[Map] Tile loading error:', error);
      });

      // Add tiles to map
      tileLayer.addTo(map);

      // Store map instance
      mapInstanceRef.current = map;

      /**
       * Handle map clicks to add new cat sightings
       * Works for both mouse clicks and touch events on mobile
       */
      map.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        console.log('[Map] Click detected at:', lat, lng);
        onAddCat(lat, lng);
      });

      /**
       * Attempt to get user's current location
       * If successful, center the map on their location
       * If denied or unavailable, keep the default center
       */
      if (navigator.geolocation) {
        console.log('[Map] Requesting geolocation...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLatLng = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(userLatLng);
            map.setView([userLatLng.lat, userLatLng.lng], 15);
            console.log('[Map] Centered on user location:', userLatLng);
          },
          (error) => {
            console.log('[Map] Geolocation denied or unavailable:', error.message);
            // Map stays at default location
          }
        );
      }

      // Fallback: mark as loaded after 2 seconds even if tile load event doesn't fire
      loadTimeout = setTimeout(() => {
        if (!tilesLoaded) {
          console.log('[Map] Fallback timeout - marking map as ready');
          setMapReady(true);
          setIsInitializing(false);
        }
      }, 2000);

      // Force map to recalculate its size after a brief delay
      // This fixes rendering issues in some scenarios
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (error) {
      console.error('[Map] Initialization error:', error);
      setMapError('Failed to initialize the map. Please refresh the page.');
      setIsInitializing(false);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        console.log('[Map] Cleaning up map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onAddCat]);

  /**
   * Update markers whenever cat sightings change
   * This adds/removes markers to reflect the current data
   */
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;

    console.log('[Map] Updating markers, count:', catSightings.length);

    // Remove all existing markers
    markers.forEach(marker => marker.remove());
    markers.clear();

    // Add new markers for each cat sighting
    catSightings.forEach((sighting) => {
      const marker = L.marker([sighting.latitude, sighting.longitude], {
        title: sighting.cats?.name || 'Unknown Cat',
        alt: `Cat sighting: ${sighting.cats?.name || 'Unknown'}`,
      }).addTo(map);

      // Show sighting details when marker is clicked
      marker.on('click', () => {
        console.log('[Map] Marker clicked:', sighting.cats?.name);
        setSelectedSighting(sighting);
      });

      // Store marker reference
      markers.set(sighting.id, marker);
    });
  }, [catSightings, mapReady]);

  /**
   * Center map on user's current location
   */
  const centerOnUserLocation = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
      console.log('[Map] Centered on user location');
    }
  }, [userLocation]);

  /**
   * Center map on a specific sighting
   */
  const centerOnSighting = useCallback((sighting: CatSighting) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([sighting.latitude, sighting.longitude], 16);
      console.log('[Map] Centered on sighting:', sighting.cats?.name);
    }
  }, []);

  /**
   * Render error state if map failed to initialize
   */
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <Card className="max-w-md text-center shadow-lg">
          <CardHeader>
            <div className="bg-destructive/10 text-destructive w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-destructive">Map Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{mapError}</p>
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

  /**
   * Render loading state while map initializes
   */
  if (isInitializing) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading map...</p>
          <p className="text-sm text-muted-foreground mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

  /**
   * Main map render
   */
  return (
    <div className="relative w-full h-full">
      {/* Map container - Leaflet renders here */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-md"
        style={{ minHeight: '400px' }}
      />

      {/* Data loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg pointer-events-none">
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">Loading cat sightings...</span>
            </div>
          </div>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Center on user location button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="shadow-lg bg-card hover:bg-accent"
          onClick={centerOnUserLocation}
          disabled={!userLocation}
          title={userLocation ? "Center on my location" : "Location not available"}
        >
          <Locate className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructions card */}
      <div className="absolute top-4 right-4 max-w-xs">
        <Card className="shadow-lg bg-card/95 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              How to use
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
            <p>• <strong>Click/tap</strong> anywhere on the map to add a cat sighting</p>
            <p>• <strong>Click markers</strong> to view existing cat details</p>
            <p>• <strong>Pan and zoom</strong> to explore different areas</p>
          </CardContent>
        </Card>
      </div>

      {/* Floating add button indicator */}
      <div className="absolute bottom-4 right-4">
        <div className="relative">
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-full shadow-lg w-14 h-14 bg-primary hover:bg-primary/90"
            title="Click on map to add cat"
            disabled
          >
            <Plus className="w-6 h-6" />
          </Button>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Selected sighting details panel */}
      {selectedSighting && (
        <Card className="absolute bottom-4 left-4 w-80 max-w-[calc(100vw-2rem)] shadow-2xl bg-card/98 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="line-clamp-1">{selectedSighting.cats?.name || 'Unknown Cat'}</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2"
                onClick={() => setSelectedSighting(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Cat image */}
            {selectedSighting.cats?.image_url && (
              <img 
                src={selectedSighting.cats.image_url} 
                alt={selectedSighting.cats.name}
                className="w-full h-40 object-cover rounded-md"
              />
            )}
            
            {/* Sighting details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Spotted:</span>
                <span className="font-medium">
                  {new Date(selectedSighting.spotted_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-mono text-xs">
                  {selectedSighting.latitude.toFixed(4)}, {selectedSighting.longitude.toFixed(4)}
                </span>
              </div>

              {selectedSighting.notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground text-xs mb-1">Notes:</p>
                  <p className="text-sm">{selectedSighting.notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => centerOnSighting(selectedSighting)}
              >
                Center Map
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
