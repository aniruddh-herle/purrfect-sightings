import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.purrfectsightings.catspotter',
  appName: 'Purrfect Sightings',
  webDir: 'dist',
  server: {
    url: 'https://88740b74-211f-41bf-b92e-a9a84fedef52.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;