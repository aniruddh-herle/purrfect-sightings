import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Navigation, Locate, AlertCircle, Layers, Wifi, WifiOff } from 'lucide-react';
import { CatSighting } from '@/hooks/useCats';
import { OPENSTREETMAP_CONFIG, getUserLocation } from '@/lib/openstreetmap';
import { OfflineMap } from './OfflineMap';
import L from 'leaflet';

// Import Leaflet CSS properly for Vite
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
  const [currentTileProvider, setCurrentTileProvider] = useState<'osm' | 'cartodb' | 'stamen'>('osm');
  const [tileLoadTimeout, setTileLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      console.log('Device detected as:', isMobileDevice ? 'mobile' : 'desktop');
    };
    
    checkMobile();
  }, []);

  // Initialize OpenStreetMap with Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('Starting map initialization...');
    console.log('Map ref exists:', !!mapRef.current);
    console.log('Map container dimensions:', mapRef.current?.offsetWidth, 'x', mapRef.current?.offsetHeight);

    try {
      setMapError(null);
      
      // Check if Leaflet is properly loaded
      if (!L || !L.map) {
        throw new Error('Leaflet library not properly loaded');
      }
      
      console.log('Leaflet version:', L.version);
      
      // Create map instance
      const map = L.map(mapRef.current, {
        center: [OPENSTREETMAP_CONFIG.defaultCenter.lat, OPENSTREETMAP_CONFIG.defaultCenter.lng],
        zoom: OPENSTREETMAP_CONFIG.defaultZoom,
        ...OPENSTREETMAP_CONFIG.mapStyles,
      });

      mapInstanceRef.current = map;

      // Force a map resize to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated');
      }, 100);

      // Add tile layer with simplified error handling
      const tileLayer = L.tileLayer(
        OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].url,
        {
          attribution: OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].attribution,
          maxZoom: OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].maxZoom,
        }
      ).addTo(map);

      console.log('Tile layer added:', OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].url);

      // Simple tile loading detection
      let hasLoadedAnyTiles = false;

      tileLayer.on('tileload', () => {
        if (!hasLoadedAnyTiles) {
          hasLoadedAnyTiles = true;
          console.log('First tile loaded successfully');
          // Clear any loading timeouts since tiles are working
          if (tileLoadTimeout) {
            clearTimeout(tileLoadTimeout);
            setTileLoadTimeout(null);
          }
        }
      });

      tileLayer.on('tileerror', (error) => {
        console.error('Tile loading error:', error);
      });

      // Set a reasonable timeout for tile loading
      const timeout = setTimeout(() => {
        if (!hasLoadedAnyTiles) {
          console.log('Map tiles taking too long to load - this is normal, map should still work');
          // Don't automatically switch to offline mode, just log the delay
        }
      }, 10000); // 10 second timeout just for logging
      
      setTileLoadTimeout(timeout);

      // Add click listener for placing pins
      map.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        onAddCat(lat, lng);
      });

      // Get user location
      getUserLocation()
        .then((location) => {
          setUserLocation(location);
          console.log('User location obtained:', location);
          
          // Center map on user location if it's the first load
          if (!mapInstanceRef.current?.getBounds()) {
            map.setView([location.lat, location.lng], 15);
            console.log('Map centered on user location');
          }
        })
        .catch((error) => {
          console.log('Geolocation error:', error);
          // Don't show error to user, just log it
        });

      setMapLoaded(true);
      console.log('Map initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize OpenStreetMap:', error);
      setMapError('Failed to initialize the map. Please refresh the page and try again.');
    }
  }, [onAddCat, currentTileProvider]);

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
      // Create custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-cat-marker',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: #3b82f6; 
            border: 2px solid white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4C9.10457 4 10 4.89543 10 6C10 7.10457 9.10457 8 8 8C6.89543 8 6 7.10457 6 6C6 4.89543 6.89543 6 8 6C8 7.10457 9.10457 8 10 8C9.10457 8 8 7.10457 8 6C6.89543 8 6 7.10457 6 6C6 7.10457 6.89543 6 8 6" fill="white"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([sighting.latitude, sighting.longitude], {
        icon: customIcon,
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

  // Change tile provider
  const changeTileProvider = useCallback((provider: 'osm' | 'cartodb' | 'stamen') => {
    if (!mapInstanceRef.current) return;

    setCurrentTileProvider(provider);
    
    // Remove existing tile layer
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Add new tile layer
    L.tileLayer(
      OPENSTREETMAP_CONFIG.tileProviders[provider].url,
      {
        attribution: OPENSTREETMAP_CONFIG.tileProviders[provider].attribution,
        maxZoom: OPENSTREETMAP_CONFIG.tileProviders[provider].maxZoom,
      }
    ).addTo(mapInstanceRef.current);
  }, []);

  // Retry loading the map
  const retryMapLoad = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setMapLoaded(false);
    setMapError(null);
    markersRef.current.clear();
    
    // Force re-initialization
    setTimeout(() => {
      if (mapRef.current) {
        const map = L.map(mapRef.current, {
          center: [OPENSTREETMAP_CONFIG.defaultCenter.lat, OPENSTREETMAP_CONFIG.defaultCenter.lng],
          zoom: OPENSTREETMAP_CONFIG.defaultZoom,
          ...OPENSTREETMAP_CONFIG.mapStyles,
        });
        
        mapInstanceRef.current = map;
        
        // Add tile layer
        const tileLayer = L.tileLayer(
          OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].url,
          {
            attribution: OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].attribution,
            maxZoom: OPENSTREETMAP_CONFIG.tileProviders[currentTileProvider].maxZoom,
          }
        ).addTo(map);
        
        // Add error handling
        tileLayer.on('tileerror', (error) => {
          console.error('Tile loading error:', error);
          setMapError('Failed to load map tiles. This might be due to internet connection issues. Please check your connection and try again.');
        });
        
        // Add click listener
        map.on('click', (event: L.LeafletMouseEvent) => {
          const { lat, lng } = event.latlng;
          onAddCat(lat, lng);
        });
        
        setMapLoaded(true);
      }
    }, 100);
  }, [currentTileProvider, onAddCat]);

  // Show offline map if in offline mode
  if (offlineMode) {
    return (
      <OfflineMap
        onAddCat={onAddCat}
        catSightings={catSightings}
        loading={loading}
        onRetryOnline={() => {
          setOfflineMode(false);
          setMapError(null);
          retryMapLoad();
        }}
      />
    );
  }

  // Show error state
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="bg-destructive text-destructive-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8" />
            </div>
            <CardTitle className="text-destructive">Map Loading Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {mapError}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={retryMapLoad} 
                className="w-full"
              >
                <Wifi className="w-4 h-4 mr-1" />
                Retry Online
              </Button>
              <Button 
                onClick={() => setOfflineMode(true)} 
                variant="outline"
                className="w-full"
              >
                <WifiOff className="w-4 h-4 mr-1" />
                Use Offline Mode
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <p className="font-medium mb-2">Troubleshooting:</p>
              <ul className="text-left space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Wait a few minutes and try again</li>
                <li>• Check if other websites load properly</li>
                <li>• Use offline mode for basic functionality</li>
              </ul>
            </div>
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
          <p className="text-muted-foreground mb-2">Loading OpenStreetMap...</p>
          <p className="text-xs text-muted-foreground mb-4">
            {isMobile ? 'Mobile device detected - maps may take longer to load' : 'This may take a while with slow internet'}
          </p>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setOfflineMode(true)}
              className="w-full"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Use Offline Mode Now
            </Button>
            {isMobile && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Try a different tile provider for mobile
                  setCurrentTileProvider('cartodb');
                  window.location.reload();
                }}
                className="w-full"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Try Alternative Map Style
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Debug info for mobile */}
      {isMobile && (
        <div className="absolute top-2 left-2 z-20 bg-black/80 text-white text-xs p-2 rounded">
          Mobile: {mapRef.current?.offsetWidth || 0} x {mapRef.current?.offsetHeight || 0}
        </div>
      )}
      
      {/* OpenStreetMap container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border-2 border-dashed border-gray-300"
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

      {/* Map controls - only show user location button */}
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

      {/* Tile provider selector */}
      <div className="absolute top-4 right-4">
        <Card className="shadow-lg bg-background/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Map Style
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <Button
                variant={currentTileProvider === 'osm' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs"
                onClick={() => changeTileProvider('osm')}
              >
                Standard
              </Button>
              <Button
                variant={currentTileProvider === 'cartodb' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs"
                onClick={() => changeTileProvider('cartodb')}
              >
                Clean
              </Button>
              <Button
                variant={currentTileProvider === 'stamen' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs"
                onClick={() => changeTileProvider('stamen')}
              >
                Terrain
              </Button>
            </div>
          </CardContent>
        </Card>
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
      <div className="absolute bottom-4 left-4 max-w-xs">
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

      {/* Custom CSS for markers */}
      <style>{`
        .custom-cat-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};
