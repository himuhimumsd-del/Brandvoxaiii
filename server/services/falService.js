// server/services/falService.js
const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '../.env' });

// Configure credentials using environment FAL_KEY
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
} else {
  console.warn('WARNING: FAL_KEY environment variable is not defined!');
}

/**
 * Initiates an asynchronous generation queue with fal.ai
 * @param {Object} params - Generation options
 * @returns {Promise<Object>} - Contains video_url, seed, and other output parameters
 */
async function generateVideo({ endpoint, prompt, duration, resolution, aspect_ratio, generate_audio, image_url }) {
  // Construct standard input payload for fal.ai endpoints
  const input = {
    prompt,
    duration: String(duration),
    aspect_ratio,
    generate_audio: !!generate_audio
  };

  // Only seed the input resolution if specified
  if (resolution) {
    input.resolution = resolution;
  }

  // Include optional source image for Image-to-Video models
  if (image_url) {
    input.image_url = image_url;
  }

  try {
    console.log(`[falService] Dispatching request to endpoint: ${endpoint}`);
    console.log('[falService] Request Payload:', JSON.stringify(input, null, 2));

    // Submit request to the dynamic endpoint
    const result = await fal.subscribe(endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`[falService] Queue state for execution: status=${update.status}`);
      }
    });

    console.log('[falService] Response Data:', JSON.stringify(result.data, null, 2));

    // Support multiple format configurations from fal models
    const videoUrl = result.data?.video?.url || result.data?.file?.url || result.data?.outputs?.[0]?.url;
    const seed = result.data?.seed || null;

    if (!videoUrl) {
      throw new Error('fal.ai did not return a valid video URL in outputs.');
    }

    return {
      video_url: videoUrl,
      seed: seed
    };
  } catch (error) {
    console.error('[falService] Generation invocation failed:', error);
    throw new Error(error.message || 'API request to fal.ai failed');
  }
}

module.exports = { generateVideo };
