const { getCapacitorFlavorConfig } = require('./scripts/capacitor-env');

const { appId, appName, serverUrl, cleartext } = getCapacitorFlavorConfig();

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId,
  appName,
  webDir: 'build',
  server: {
    url: serverUrl,
    cleartext,
  },
  plugins: {
    Keyboard: { resize: 'body', style: 'light' },
    Camera: { presentationStyle: 'fullscreen' },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    StatusBar: { overlaysWebView: true, style: 'LIGHT', backgroundColor: '#F5F6F8' },
  },
  ios: { contentInset: 'never', scheme: 'Pebble', backgroundColor: '#F5F6F8' },
};

module.exports = config;
