/**
 * Application Configuration
 */
module.exports = {
  // 火山引擎 Ark API
  ark: {
    apiKey: process.env.ARK_API_KEY || '',
    endpoint: process.env.ARK_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.ARK_MODEL || 'doubao-seedream-4-5-251128',
  },
  
  // Doubao (备用)
  doubao: {
    apiKey: process.env.DOUBAO_API_KEY || '',
    model: process.env.DOUBAO_MODEL || '',
    baseUrl: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  },
  
  // 火山引擎 TOS (对象存储)
  tos: {
    accessKeyId: process.env.TOS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY || '',
    bucket: process.env.TOS_BUCKET || '',
    region: process.env.TOS_REGION || 'cn-beijing',
    endpoint: process.env.TOS_ENDPOINT || 'tos-cn-beijing.volces.com',
  },
  
  // Apple IAP
  apple: {
    sharedSecret: process.env.APPLE_SHARED_SECRET || '',
    verifyUrl: 'https://buy.itunes.apple.com/verifyReceipt',
    sandboxVerifyUrl: 'https://sandbox.itunes.apple.com/verifyReceipt',
  },
  
  // App settings
  app: {
    freeUsageLimit: parseInt(process.env.FREE_USAGE_LIMIT || '1', 10),
    maxImageSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
    maxImageDimension: parseInt(process.env.MAX_IMAGE_DIMENSION || '2048', 10),
    // Dev mode - bypass paywall
    devMode: process.env.NODE_ENV !== 'production' || process.env.DEV_MODE === 'true',
  },
};
