/**
 * API service for backend communication
 */
import { API_URL, TIMEOUTS, DEV_MODE } from '../constants/config';

// Log API URL on init
if (DEV_MODE) {
  console.log('🔧 API URL:', API_URL);
}

export interface Entitlement {
  installId: string;
  isPro: boolean;
  freeRemaining: number;
}

export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface EditRequest {
  installId: string;
  imageBase64: string;
  bbox: BBox;
  retryLevel?: number;
}

export interface EditResponse {
  resultBase64: string;
  meta: {
    retryLevel: number;
  };
}

export interface EditError {
  code: string;
  message: string;
}

export interface IAPVerifyRequest {
  installId: string;
  platform: 'ios';
  productId: string;
  receipt: string;
}

export interface IAPVerifyResponse {
  isPro: boolean;
  freeRemaining: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get entitlements for install ID
 */
export async function getEntitlements(installId: string): Promise<Entitlement> {
  const response = await fetchWithTimeout(
    `${API_URL}/v1/entitlements?installId=${encodeURIComponent(installId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    TIMEOUTS.IAP_VERIFY,
  );

  if (!response.ok) {
    throw new ApiError('Failed to get entitlements', response.status);
  }

  const data = await response.json();
  return {
    installId: data.install_id || data.installId,
    isPro: data.is_pro || data.isPro,
    freeRemaining: data.free_remaining ?? data.freeRemaining ?? 0,
  };
}

/**
 * Edit image to remove watermark
 */
export async function editImage(request: EditRequest): Promise<EditResponse> {
  console.log('📤 Sending edit request to:', `${API_URL}/v1/edit`);
  console.log('📤 Image size:', Math.round(request.imageBase64.length / 1024), 'KB');
  
  const startTime = Date.now();
  
  const response = await fetchWithTimeout(
    `${API_URL}/v1/edit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installId: request.installId,
        imageBase64: request.imageBase64,
        bbox: request.bbox,
        retryLevel: request.retryLevel ?? 0,
      }),
    },
    TIMEOUTS.API_REQUEST,
  );
  
  console.log('📥 Response received in', Date.now() - startTime, 'ms, status:', response.status);

  if (response.status === 402) {
    const error = await response.json() as EditError;
    throw new ApiError(error.message, 402, error.code);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || 'Edit failed', response.status);
  }

  const data = await response.json();
  return {
    resultBase64: data.result_base64 || data.resultBase64,
    meta: data.meta || { retryLevel: request.retryLevel ?? 0 },
  };
}

/**
 * Verify IAP receipt
 */
export async function verifyIAP(request: IAPVerifyRequest): Promise<IAPVerifyResponse> {
  const response = await fetchWithTimeout(
    `${API_URL}/v1/iap/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installId: request.installId,
        platform: request.platform,
        productId: request.productId,
        receipt: request.receipt,
      }),
    },
    TIMEOUTS.IAP_VERIFY,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || 'IAP verification failed', response.status);
  }

  const data = await response.json();
  return {
    isPro: data.is_pro || data.isPro,
    freeRemaining: data.free_remaining ?? data.freeRemaining ?? 0,
  };
}

export { ApiError };

