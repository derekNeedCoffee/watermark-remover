/**
 * Edit API Routes
 */
const express = require('express');
const sharp = require('sharp');
const { getOrCreateEntitlement, incrementFreeUsedCount } = require('../db');
const { editImageWithDoubao } = require('../services/doubao');
const config = require('../config');

const router = express.Router();

/**
 * POST /v1/edit
 * Edit image to remove watermark/overlay
 */
router.post('/edit', async (req, res) => {
  const { installId, imageBase64, bbox, retryLevel = 0 } = req.body;
  
  // Validate request
  if (!installId || !imageBase64 || !bbox) {
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'installId, imageBase64, and bbox are required',
    });
  }
  
  // Validate bbox
  if (
    typeof bbox.x0 !== 'number' || typeof bbox.y0 !== 'number' ||
    typeof bbox.x1 !== 'number' || typeof bbox.y1 !== 'number' ||
    bbox.x0 < 0 || bbox.y0 < 0 || bbox.x1 > 1 || bbox.y1 > 1 ||
    bbox.x0 >= bbox.x1 || bbox.y0 >= bbox.y1
  ) {
    return res.status(400).json({
      code: 'INVALID_BBOX',
      message: 'Invalid bbox coordinates',
    });
  }
  
  try {
    // Check entitlement
    const entitlement = getOrCreateEntitlement(installId);
    const isPro = !!entitlement.is_pro;
    
    // In dev mode, bypass paywall
    if (config.app.devMode) {
      console.log('🔧 DEV MODE: Bypassing paywall check');
    } else if (!isPro && entitlement.free_used_count >= config.app.freeUsageLimit) {
      return res.status(402).json({
        code: 'PAYWALL',
        message: 'Free quota used. Please purchase Pro.',
      });
    }
    
    // Process image
    const processedImage = await validateAndResizeImage(imageBase64);
    
    // Call Doubao API
    const resultBase64 = await editImageWithDoubao(processedImage, bbox, retryLevel);
    
    if (!resultBase64) {
      return res.status(500).json({
        code: 'PROCESSING_FAILED',
        message: 'Image processing returned no result',
      });
    }
    
    // Success - increment free used count if not pro (skip in dev mode)
    if (!isPro && !config.app.devMode) {
      incrementFreeUsedCount(installId);
    }
    
    res.json({
      resultBase64,
      meta: { retryLevel },
    });
  } catch (error) {
    console.error('Edit error:', error);
    
    if (error.message.includes('too large')) {
      return res.status(413).json({
        code: 'IMAGE_TOO_LARGE',
        message: error.message,
      });
    }
    
    res.status(500).json({
      code: 'PROCESSING_FAILED',
      message: error.message || 'Image processing failed',
    });
  }
});

/**
 * Validate and resize image if necessary
 * Converts HEIC/HEIF to JPEG automatically
 */
async function validateAndResizeImage(imageBase64) {
  // Extract base64 data
  let base64Data = imageBase64;
  let mimeType = 'image/jpeg';
  
  if (imageBase64.includes(',')) {
    const parts = imageBase64.split(',');
    const header = parts[0];
    base64Data = parts[1];
    
    if (header.includes('png')) {
      mimeType = 'image/png';
    } else if (header.includes('heic') || header.includes('heif')) {
      // HEIC/HEIF format detected - will convert to JPEG
      console.log('⚠️ HEIC/HEIF format detected, converting to JPEG...');
    }
  }
  
  // Decode image
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Check size
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > config.app.maxImageSizeMB) {
    throw new Error(`Image too large: ${sizeMB.toFixed(1)}MB (max: ${config.app.maxImageSizeMB}MB)`);
  }
  
  try {
    // Get image metadata and resize if needed
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    console.log(`📷 Image format: ${metadata.format}, size: ${metadata.width}x${metadata.height}`);
    
    const maxDim = config.app.maxImageDimension;
    
    // Always convert to JPEG to ensure compatibility
    // This also handles HEIC -> JPEG conversion
    const resized = await image
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    console.log(`📷 Converted to JPEG: ${Math.round(resized.length / 1024)} KB`);
    
    return `data:image/jpeg;base64,${resized.toString('base64')}`;
  } catch (error) {
    // If sharp fails (e.g., HEIC not supported), throw a user-friendly error
    if (error.message.includes('heif') || error.message.includes('heic')) {
      throw new Error('HEIC/HEIF format not supported. Please convert to JPEG first in the app.');
    }
    throw error;
  }
}

module.exports = router;

