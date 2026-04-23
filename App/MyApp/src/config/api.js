/**
 * API Configuration
 * Update the API_BASE_URL when your ngrok URL changes
 */

// IMPORTANT: Update this URL when you restart ngrok
export const API_BASE_URL = 'https://5c7b3538eb97.ngrok-free.app';

// Alternative: Use your local IP for testing without ngrok
// export const API_BASE_URL = 'http://192.168.1.100:3000';

export const API_ENDPOINTS = {
  WATER_TESTS: '/api/mobile/water-tests',
  HEALTH_REPORTS: '/api/mobile/health-reports',
  ISSUE_REPORTS: '/api/mobile/issue-reports',
  HOUSEHOLD_SURVEYS: '/api/mobile/household-surveys',
  SYNC_UPDATES: '/api/mobile/sync/updates',
};

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};
