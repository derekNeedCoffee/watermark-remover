/**
 * Entitlements API Routes
 */
const express = require('express');
const { getOrCreateEntitlement } = require('../db');
const config = require('../config');

const router = express.Router();

/**
 * GET /v1/entitlements
 * Get entitlements for a given install ID
 */
router.get('/entitlements', (req, res) => {
  const installId = req.query.installId;
  
  if (!installId) {
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'installId is required',
    });
  }
  
  try {
    const entitlement = getOrCreateEntitlement(installId);
    
    const isPro = !!entitlement.is_pro;
    const freeRemaining = isPro 
      ? 999 
      : Math.max(0, config.app.freeUsageLimit - entitlement.free_used_count);
    
    res.json({
      installId: entitlement.install_id,
      isPro,
      freeRemaining,
    });
  } catch (error) {
    console.error('Error getting entitlements:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get entitlements',
    });
  }
});

module.exports = router;

