/**
 * IAP Verification API Routes
 */
const express = require('express');
const { getOrCreateEntitlement, updateEntitlement, addCredits, transactionExists, saveTransaction } = require('../db');
const config = require('../config');

// Credits amount per product
const CREDITS_PER_PRODUCT = {
  'credits_10': 10,
  'credits_50': 50,
  'credits_100': 100,
};
const { verifyAppleReceipt } = require('../services/iapVerify');

const router = express.Router();

/**
 * POST /v1/iap/verify
 * Verify IAP receipt and update entitlements
 */
router.post('/iap/verify', async (req, res) => {
  const { installId, platform, productId, receipt } = req.body;
  
  // Validate request
  if (!installId || !receipt) {
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'installId and receipt are required',
    });
  }
  
  if (platform !== 'ios') {
    return res.status(400).json({
      code: 'INVALID_PLATFORM',
      message: 'Only iOS platform is supported',
    });
  }
  
  // Validate product ID
  const validProducts = Object.keys(CREDITS_PER_PRODUCT);
  if (!validProducts.includes(productId)) {
    return res.status(400).json({
      code: 'INVALID_PRODUCT',
      message: `Invalid product ID. Valid products: ${validProducts.join(', ')}`,
    });
  }
  
  try {
    // Verify receipt with Apple
    const { isValid, receiptInfo } = await verifyAppleReceipt(receipt);
    
    if (!isValid) {
      return res.status(400).json({
        code: 'INVALID_RECEIPT',
        message: receiptInfo?.error || 'Invalid receipt',
      });
    }
    
    // Check if transaction already exists
    if (!transactionExists(receiptInfo.transactionId)) {
      // Save new transaction
      saveTransaction({
        transactionId: receiptInfo.transactionId,
        originalTransactionId: receiptInfo.originalTransactionId,
        productId: receiptInfo.productId,
        installId,
        purchasedAt: receiptInfo.purchasedAt,
        rawReceipt: receipt.substring(0, 500), // Store partial for reference
      });
    }
    
    // Add credits to user
    getOrCreateEntitlement(installId);
    const creditsToAdd = CREDITS_PER_PRODUCT[productId] || 0;
    addCredits(installId, creditsToAdd);
    
    // Get updated entitlement
    const entitlement = getOrCreateEntitlement(installId);
    
    res.json({
      success: true,
      creditsAdded: creditsToAdd,
      credits: entitlement.credits,
      freeRemaining: Math.max(0, config.app.freeUsageLimit - entitlement.free_used_count),
    });
  } catch (error) {
    console.error('IAP verification error:', error);
    res.status(500).json({
      code: 'VERIFICATION_FAILED',
      message: error.message || 'IAP verification failed',
    });
  }
});

module.exports = router;


