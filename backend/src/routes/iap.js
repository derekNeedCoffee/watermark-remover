/**
 * IAP Verification API Routes
 */
const express = require('express');
const { getOrCreateEntitlement, updateEntitlement, transactionExists, saveTransaction } = require('../db');
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
  
  if (productId !== 'pro_unlock') {
    return res.status(400).json({
      code: 'INVALID_PRODUCT',
      message: 'Invalid product ID',
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
    
    // Update entitlement to Pro
    getOrCreateEntitlement(installId);
    updateEntitlement(installId, { is_pro: true });
    
    res.json({
      isPro: true,
      freeRemaining: 0,
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

