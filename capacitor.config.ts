import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.chalidade.pejuangumrah',
  appName: 'Pejuang Umrah',
  webDir: 'dist',
  android: {
    backgroundColor: '#FFFFFF',
  },
  ios: {
    backgroundColor: '#FFFFFF',
    contentInset: 'never',
  },
}

export default config
