/**
 * App configuration constants
 */

// Development mode - set to true to bypass paywall
export const DEV_MODE = __DEV__ || process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// API Configuration
// Use your computer's local IP for real device testing
// Find your IP with: ipconfig getifaddr en0
const LOCAL_IP = '192.168.18.234';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:8000`;

// IAP Product IDs
export const IAP_PRODUCTS = {
  PRO_UNLOCK: 'pro_unlock',
} as const;

// Image constraints
export const IMAGE_CONFIG = {
  MAX_DIMENSION: 2048,
  QUALITY: 0.9,
  MIN_BBOX_SIZE: 24, // Minimum bbox size in pixels
} as const;

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 180000, // 3 minutes for image processing (real device may be slow)
  IAP_VERIFY: 30000,   // 30 seconds for IAP verification
} as const;

