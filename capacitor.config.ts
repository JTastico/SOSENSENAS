
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gestureapp.alertvision',
  appName: 'Gesture Alert Vision',
  webDir: 'dist',
  bundledWebRuntime: false,
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#000000'
    },
    CapacitorHttp: {
      enabled: true
    }
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    useLegacyBridge: false,
    backgroundColor: '#ffffff'
  }
};

export default config;
