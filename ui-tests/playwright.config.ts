import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 20000,
  use: {
    // Browser options
    // headless: false,
    launchOptions: {
      slowMo: 400,
    },

    // Context options
    viewport: { width: 1280, height: 720 },

    // Artifacts
    video: 'on',
  },
};

export default config;
