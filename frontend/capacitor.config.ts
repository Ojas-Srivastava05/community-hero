import type { CapacitorConfig } from '@capacitor/cli'

const CLOUD_RUN_URL = 'https://community-hero-987477089222.asia-south1.run.app'

const config: CapacitorConfig = {
  appId: 'com.vibe2ship.communityhero',
  appName: 'Community Hero',
  webDir: 'dist',
  server: {
    url: CLOUD_RUN_URL,
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
