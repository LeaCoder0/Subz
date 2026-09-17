import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flasskamp.subz.dev',
  appName: 'Subz',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      backgroundColor: '#1f1f1f',
      launchAutoHide: false,
    },
  },
};

export default config;
