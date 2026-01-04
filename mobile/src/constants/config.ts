/**
 * App configuration constants
 */

// Development mode - set to true to bypass paywall
// Set to false to show paywall for screenshots/testing
export const DEV_MODE = false;

// API Configuration
// Production server
const PROD_API = 'https://www.derektaotang.com';
// Local development (use your computer's IP for real device testing)
const LOCAL_IP = '192.168.18.234';
const LOCAL_API = `http://${LOCAL_IP}:8000`;

// Switch between local and production
const USE_PROD = true; // 改为 false 使用本地服务器
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (USE_PROD ? PROD_API : LOCAL_API);

// IAP Product IDs
export const IAP_PRODUCTS = {
  CREDITS_10: 'credits_10',
  CREDITS_50: 'credits_50',
  CREDITS_100: 'credits_100',
} as const;

// Credits per purchase
export const CREDITS_AMOUNT = {
  credits_10: 10,
  credits_50: 50,
  credits_100: 100,
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

