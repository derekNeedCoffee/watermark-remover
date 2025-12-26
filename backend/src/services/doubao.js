/**
 * 火山引擎 Ark 图像编辑服务
 * 使用 Doubao Seedream 模型进行图生图编辑
 * 
 * Seedream 4.0+ 支持图像编辑功能，通过提示词控制去除水印
 */
const axios = require('axios');
const config = require('../config');

// Prompt templates for watermark removal - 强调保持原图，只去水印
const PROMPTS = {
  0: `请严格按照参考图生成图片，保持所有内容完全一致，只需要去除图片中位于 {bbox_desc} 位置的水印/文字/覆盖物。其他区域必须保持像素级一致。`,
  1: `基于参考图进行编辑：去除位于 {bbox_desc} 区域的水印和文字。要求：1) 水印区域用周围纹理自然填充 2) 其他区域100%保持原样 3) 边界过渡自然无痕迹`,
  2: `图像修复任务：去除参考图中 {bbox_desc} 位置的水印。严格要求：完全复制原图，仅修复水印区域，使用智能填充匹配周围像素和纹理。`,
};

// English prompts as fallback
const PROMPTS_EN = {
  0: `Generate an image identical to the reference, but remove the watermark/text/overlay in the region at {bbox_desc}. Everything else must remain pixel-perfect identical.`,
  1: `Edit the reference image: Remove watermark in the {bbox_desc} region. Requirements: 1) Fill watermark area with surrounding texture 2) Keep all other areas 100% identical 3) Seamless boundary transition`,
  2: `Image inpainting task: Remove watermark at {bbox_desc} from reference. Strict requirements: Copy original exactly, only repair watermark region, smart fill matching surrounding pixels.`,
};

/**
 * Expand bounding box by a given ratio from center
 */
function expandBBox(bbox, expandRatio = 0.1) {
  const width = bbox.x1 - bbox.x0;
  const height = bbox.y1 - bbox.y0;
  
  const expandX = width * expandRatio / 2;
  const expandY = height * expandRatio / 2;
  
  return {
    x0: Math.max(0, bbox.x0 - expandX),
    y0: Math.max(0, bbox.y0 - expandY),
    x1: Math.min(1, bbox.x1 + expandX),
    y1: Math.min(1, bbox.y1 + expandY),
  };
}

/**
 * Build bbox description string
 */
function getBBoxDesc(bbox) {
  const left = (bbox.x0 * 100).toFixed(0);
  const top = (bbox.y0 * 100).toFixed(0);
  const right = (bbox.x1 * 100).toFixed(0);
  const bottom = (bbox.y1 * 100).toFixed(0);
  return `左${left}% 上${top}% 右${right}% 下${bottom}%`;
}

/**
 * Build prompt for image editing
 */
function buildPrompt(bbox, retryLevel, useEnglish = false) {
  const prompts = useEnglish ? PROMPTS_EN : PROMPTS;
  let prompt = prompts[retryLevel] || prompts[0];
  const bboxDesc = getBBoxDesc(bbox);
  return prompt.replace('{bbox_desc}', bboxDesc);
}

/**
 * Call Ark API for image generation with reference image
 * 使用火山引擎 Ark Seedream 模型的图生图功能
 */
async function editImageWithDoubao(imageBase64, bbox, retryLevel = 0) {
  // Expand bbox for retry level 2
  const processedBBox = retryLevel === 2 ? expandBBox(bbox, 0.1) : bbox;
  
  // Build prompt - 尝试中文，如果失败用英文
  const prompt = buildPrompt(processedBBox, retryLevel, false);
  
  // Ensure base64 has proper format
  let base64Data = imageBase64;
  if (imageBase64.includes(',')) {
    base64Data = imageBase64.split(',')[1];
  }
  
  // Check if API key is configured
  if (!config.ark.apiKey) {
    console.warn('Ark API key not configured, returning mock result');
    return imageBase64;
  }
  
  try {
    console.log('Calling Ark API for image editing...');
    console.log('Endpoint:', `${config.ark.endpoint}/images/generations`);
    console.log('Model:', config.ark.model);
    console.log('Prompt:', prompt);
    console.log('BBox:', processedBBox);
    
    // 构建 data URL 格式的图片
    const imageDataUrl = `data:image/jpeg;base64,${base64Data}`;
    
    // 使用 Ark images/generations API 的图生图模式
    // image 参数使用 data URL 格式
    const response = await axios.post(
      `${config.ark.endpoint}/images/generations`,
      {
        model: config.ark.model,
        prompt: prompt,
        // 参考图像 - 使用 data URL 格式
        image: imageDataUrl,
        // 图像尺寸 - Seedream 要求至少 3686400 像素 (1920x1920)
        size: '1920x1920',
        // 生成数量
        n: 1,
        // 响应格式
        response_format: 'b64_json',
        // 不添加水印
        watermark: false,
        // 图生图强度 - 越高越接近原图
        // strength: 0.9,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ark.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024,
      }
    );
    
    console.log('Ark API response status:', response.status);
    
    // 解析响应
    if (response.data?.data?.[0]) {
      const result = response.data.data[0];
      
      if (result.b64_json) {
        console.log('Got base64 image from response');
        return `data:image/png;base64,${result.b64_json}`;
      }
      
      if (result.url) {
        console.log('Got URL from response, fetching image...');
        const imgResponse = await axios.get(result.url, { 
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        const imgBase64 = Buffer.from(imgResponse.data).toString('base64');
        return `data:image/png;base64,${imgBase64}`;
      }
    }
    
    console.error('No image found in response:', JSON.stringify(response.data).substring(0, 500));
    throw new Error('No image returned from API');
  } catch (error) {
    console.error('Ark API error:', error.response?.status, error.response?.data || error.message);
    
    const errorMsg = error.response?.data?.error?.message 
      || error.response?.data?.message 
      || error.message;
    
    throw new Error(`Ark API error: ${errorMsg}`);
  }
}

module.exports = {
  editImageWithDoubao,
  expandBBox,
  buildPrompt,
  getBBoxDesc,
};
