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
// 本地开发时改为 false，TestFlight/Release 永远用 PROD_API
const USE_LOCAL_DEV = false;

// 简化逻辑：直接根据 USE_LOCAL_DEV 决定，避免环境变量污染
export const API_URL = USE_LOCAL_DEV ? LOCAL_API : PROD_API;

// 启动时打印 API URL 用于调试
console.log('🌐 API_URL:', API_URL);

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

