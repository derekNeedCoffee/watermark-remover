/**
 * Apple IAP Receipt Verification Service
 */
const axios = require('axios');
const config = require('../config');

/**
 * Verify Apple IAP receipt
 */
async function verifyAppleReceipt(receiptData) {
  const payload = {
    'receipt-data': receiptData,
    'password': config.apple.sharedSecret,
    'exclude-old-transactions': true,
  };
  
  try {
    // Try production first
    let response = await axios.post(config.apple.verifyUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    
    let result = response.data;
    
    // Status 21007 means this is a sandbox receipt
    if (result.status === 21007) {
      response = await axios.post(config.apple.sandboxVerifyUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      result = response.data;
    }
    
    // Check status
    if (result.status !== 0) {
      return {
        isValid: false,
        receiptInfo: { error: `Invalid receipt status: ${result.status}` },
      };
    }
    
    // Parse receipt
    const receipt = result.receipt || {};
    const inApp = receipt.in_app || [];
    
    // Find pro_unlock purchase
    let proPurchase = null;
    
    for (const purchase of inApp) {
      if (purchase.product_id === 'pro_unlock') {
        proPurchase = purchase;
        break;
      }
    }
    
    // Check latest_receipt_info if not found
    if (!proPurchase) {
      const latestInfo = result.latest_receipt_info || [];
      for (const info of latestInfo) {
        if (info.product_id === 'pro_unlock') {
          proPurchase = info;
          break;
        }
      }
    }
    
    if (!proPurchase) {
      return {
        isValid: false,
        receiptInfo: { error: 'pro_unlock purchase not found' },
      };
    }
    
    // Extract transaction info
    const transactionId = proPurchase.transaction_id;
    const originalTransactionId = proPurchase.original_transaction_id || transactionId;
    const purchaseDateMs = proPurchase.purchase_date_ms;
    
    let purchasedAt = null;
    if (purchaseDateMs) {
      purchasedAt = new Date(parseInt(purchaseDateMs, 10)).toISOString();
    }
    
    return {
      isValid: true,
      receiptInfo: {
        transactionId,
        originalTransactionId,
        productId: 'pro_unlock',
        purchasedAt,
      },
    };
  } catch (error) {
    console.error('Apple receipt verification error:', error);
    return {
      isValid: false,
      receiptInfo: { error: error.message },
    };
  }
}

module.exports = {
  verifyAppleReceipt,
};

