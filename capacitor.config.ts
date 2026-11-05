import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindforge.learninghub',
  appName: 'MindForge',
  webDir: 'capacitor-web',
  server: {
    // Replace with your deployed HTTPS URL before building the Android app.
    // This packages the hosted app; an internet connection is required.
    url: 'https://REPLACE-WITH-YOUR-MINDFORGE-DOMAIN',
    cleartext: false,
  },
};

export default config;
