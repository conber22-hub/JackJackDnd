import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  fullyParallel:false,
  workers:1,
  forbidOnly:!!process.env.CI,
  retries:0,
  timeout:60_000,
  expect:{ timeout:15_000 },
  reporter:[['list'], ['html', { open:'never' }]],
  use:{
    baseURL:'http://127.0.0.1:4173',
    browserName:'chromium',
    viewport:{ width:1280, height:800 },
    // PW_CHROMIUM: use a Chromium that is already installed (a cloud sandbox's) instead of Playwright's own download
    launchOptions:{ args:['--enable-unsafe-swiftshader'], ...(process.env.PW_CHROMIUM ? { executablePath:process.env.PW_CHROMIUM } : {}) },
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
  },
  webServer:{
    command:'npm run build && node tests/e2e/server.js',
    url:'http://127.0.0.1:4173/dread-delve.html',
    reuseExistingServer:false,
    timeout:120_000,
  },
});
