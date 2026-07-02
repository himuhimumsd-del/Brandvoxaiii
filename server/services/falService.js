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
async function generateVideo({ endpoint, prompt, duration, resolution, aspect_ratio, generate_audio, image_url, webhookUrl, generationId }) {
  const input = {
    prompt,
    duration: String(duration),
    aspect_ratio,
    generate_audio: !!generate_audio
  };

  if (resolution) input.resolution = resolution;
  if (image_url) input.image_url = image_url;

  try {
    console.log(`[falService] Dispatching queue request to endpoint: ${endpoint}`);

    // Check if we want to use webhooks
    if (webhookUrl) {
      const result = await fal.queue.submit(endpoint, {
        input,
        webhookUrl: `${webhookUrl}?generationId=${generationId}`
      });
      console.log(`[falService] Submitted to queue, request ID:`, result.request_id);
      return { request_id: result.request_id };
    } else {
      // Fallback to subscribe if no webhook
      const result = await fal.subscribe(endpoint, { input });
      const videoUrl = result.data?.video?.url || result.data?.file?.url || result.data?.outputs?.[0]?.url;
      if (!videoUrl) throw new Error('fal.ai did not return a valid video URL.');
      return { video_url: videoUrl, seed: result.data?.seed };
    }
  } catch (error) {
    console.error('[falService] Generation invocation failed:', error);
    throw new Error(error.message || 'API request to fal.ai failed');
  }
}

module.exports = { generateVideo };
