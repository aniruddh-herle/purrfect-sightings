import { Loader } from '@googlemaps/js-api-loader';

// Google Maps API configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry'],
};

// Initialize Google Maps loader
export const googleMapsLoader = new Loader(GOOGLE_MAPS_CONFIG);

// Load Google Maps API
export const loadGoogleMaps = async () => {
  try {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      throw new Error('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
    }
    
    const google = await googleMapsLoader.load();
    return google;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    throw error;
  }
};

// Default map center (New York City)
export const DEFAULT_MAP_CENTER = {
  lat: 40.7128,
  lng: -74.0060,
};

// Default map zoom level
export const DEFAULT_MAP_ZOOM = 13;

// Map styles for a more aesthetic appearance
export const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e3f2fd' }],
  },
];
