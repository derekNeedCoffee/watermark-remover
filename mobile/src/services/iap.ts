/**
 * In-App Purchase service using react-native-iap
 */
import * as IAP from 'react-native-iap';
import { Platform } from 'react-native';
import { IAP_PRODUCTS } from '../constants/config';
import { verifyIAP } from './api';

export interface PurchaseResult {
  success: boolean;
  error?: string;
  credits?: number;
}

let isInitialized = false;

/**
 * Initialize IAP connection
 */
export async function initializeIAP(): Promise<void> {
  if (isInitialized) return;

  try {
    await IAP.initConnection();
    if (Platform.OS === 'ios') {
      await IAP.clearTransactionIOS();
    }
    isInitialized = true;
    console.log('✅ IAP initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize IAP:', err);
    throw err;
  }
}

/**
 * Get available products
 */
export async function getProducts(): Promise<IAP.Product[]> {
  try {
    await initializeIAP();
    const skus = Object.values(IAP_PRODUCTS);
    const products = await IAP.getProducts({ skus: skus });
    console.log(`📦 Fetched ${products.length} products`);
    return products;
  } catch (err) {
    console.error('❌ Failed to fetch products:', err);
    return [];
  }
}

/**
 * Purchase credits
 */
export async function purchaseCredits(installId: string, productId: string): Promise<PurchaseResult> {
  try {
    await initializeIAP();

    console.log(`🛒 Requesting purchase for ${productId}...`);
    const purchaseResult = await IAP.requestPurchase({ sku: productId });

    // Handle both single object and array return types
    const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;

    if (purchase) {
      const receipt = purchase.transactionReceipt;

      console.log('🔗 Verifying purchase with backend...');
      const result = await verifyIAP({
        installId,
        platform: 'ios',
        productId: purchase.productId,
        receipt: receipt,
      });

      // Finish transaction (cross-platform method in v12)
      await IAP.finishTransaction({ purchase: purchase, isConsumable: true });

      return {
        success: true,
        credits: result.creditsAdded
      };
    }

    return { success: false, error: 'Purchase failed or cancelled' };
  } catch (err) {
    console.error('❌ Purchase error:', err);
    let errorMessage = 'Purchase failed';

    if (err instanceof Error) {
      if ((err as any).code === 'E_USER_CANCELLED') {
        return { success: false, error: 'User cancelled' };
      }
      errorMessage = err.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Purchase pro unlock (legacy - kept for compatibility)
 */
export async function purchaseProUnlock(installId: string): Promise<PurchaseResult> {
  return purchaseCredits(installId, IAP_PRODUCTS.CREDITS_100);
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(installId: string): Promise<PurchaseResult> {
  try {
    await initializeIAP();
    const purchases = await IAP.getAvailablePurchases();

    if (purchases && purchases.length > 0) {
      console.log(`🔄 Found ${purchases.length} previous purchases`);
      // For watermark remover, these are consumables, so they've likely been used.
      // But we can check for non-consumable 'pro_unlock' if it existed.
      for (const purchase of purchases) {
        if (purchase.productId === 'pro_unlock') {
          await verifyIAP({
            installId,
            platform: 'ios',
            productId: purchase.productId,
            receipt: purchase.transactionReceipt,
          });
          return { success: true };
        }
      }
    }

    return { success: false, error: 'No restorable purchases found' };
  } catch (err) {
    console.error('❌ Restore error:', err);
    return { success: false, error: 'Restore failed' };
  }
}

/**
 * Disconnect IAP
 */
export async function disconnectIAP(): Promise<void> {
  if (isInitialized) {
    await IAP.endConnection();
    isInitialized = false;
  }
}


