#!/usr/bin/env node
/**
 * Wait for both client and API servers to be ready
 * Used by Playwright before running E2E tests
 */

const http = require('http');

const checkServer = (url) => {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
};

const waitForServers = async () => {
  const clientUrl = 'http://localhost:5173';
  const apiUrl = 'http://localhost:3001/health';
  const maxAttempts = 60; // 60 seconds
  const delay = 1000; // 1 second

  console.log('Waiting for servers to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    const [clientReady, apiReady] = await Promise.all([
      checkServer(clientUrl),
      checkServer(apiUrl)
    ]);

    if (clientReady && apiReady) {
      console.log('✅ Both servers are ready!');
      process.exit(0);
    }

    if (!clientReady) {
      console.log(`  ⏳ Waiting for client server (${clientUrl})...`);
    }
    if (!apiReady) {
      console.log(`  ⏳ Waiting for API server (${apiUrl})...`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  console.error('❌ Timeout waiting for servers to start');
  process.exit(1);
};

waitForServers();
