// OpenStreetMap configuration for Leaflet
export const OPENSTREETMAP_CONFIG = {
  // Default map center (New York City)
  defaultCenter: {
    lat: 40.7128,
    lng: -74.0060,
  },
  
  // Default zoom level
  defaultZoom: 13,
  
  // Map tile providers (all free) - Using HTTPS for mobile compatibility
  tileProviders: {
    // OpenStreetMap (default) - HTTPS version
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    
    // CartoDB Positron (clean, minimal style) - HTTPS
    cartodb: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    },
    
    // Stamen Terrain (detailed terrain) - HTTPS
    stamen: {
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> — Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    },
    
    // Alternative: OpenStreetMap with different subdomains for better mobile performance
    osmAlt: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    },
  },
  
  // Custom map styles for a more aesthetic appearance and mobile compatibility
  mapStyles: {
    // Enable all controls for mobile
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    dragging: true,
    touchZoom: true,
    // Mobile-specific optimizations
    tap: true,
    bounceAtZoomLimits: false,
    worldCopyJump: true,
  },
  
  // Marker icon configuration
  markerIcon: {
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  },
};

// Helper function to get user's current location
export const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: false, // Changed to false for better mobile compatibility
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 300000, // Increased to 5 minutes for better performance
      }
    );
  });
};

// Helper function to calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
