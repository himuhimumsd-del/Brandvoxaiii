// server/routes/generate.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { generationLimiter } = require('../middleware/rateLimit');
const supabase = require('../lib/supabase');
const falService = require('../services/falService');
const creditService = require('../services/creditService');
const { createNotification } = require('../services/notificationService');

/**
 * POST /api/generate
 * Dispatches an asynchronous AI video generation job
 */
router.post('/', authMiddleware, generationLimiter, async (req, res) => {
  const {
    prompt,
    model_id,
    duration,
    resolution,
    aspect_ratio,
    generate_audio,
    image_url
  } = req.body;

  // 1. Inputs validation
  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a detailed prompt describing your video.' });
  }

  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompts cannot exceed 500 characters.' });
  }

  if (!model_id) {
    return res.status(400).json({ error: 'Please select an AI video model.' });
  }

  const selectedDuration = parseInt(duration) || 10; // default 10 seconds
  const selectedAudio = !!generate_audio;

  try {
    // 2. Fetch model configuration to calculate exact cost
    const { data: model, error: modelErr } = await supabase
      .from('models')
      .select('*')
      .eq('id', model_id)
      .eq('is_active', true)
      .single();

    if (modelErr || !model) {
      return res.status(404).json({ error: 'Selected model is not active or unavailable.' });
    }

    // Assert inputs compatibility
    if (model.supports_image_input && !image_url) {
      return res.status(400).json({ error: 'An input image URL is required for this image-to-video model.' });
    }

    if (selectedDuration > model.max_duration) {
      return res.status(400).json({ error: `Selected duration exceeds model maximum of ${model.max_duration} seconds.` });
    }

    // Cost = duration * price_per_second
    const pricePerSec = parseFloat(model.price_per_second);
    const estimatedCost = selectedDuration * pricePerSec;

    // 3. Server-side credit check
    if (req.user.credits < estimatedCost) {
      return res.status(400).json({
        error: `Insufficient balance. Estimated cost is ₹${estimatedCost.toFixed(2)}, but you only have ₹${req.user.credits.toFixed(2)} credits.`
      });
    }

    // 4. Create generation record in DB with 'pending' status
    const defaultTitle = prompt.slice(0, 30).trim() + '...';
    const { data: generation, error: dbErr } = await supabase
      .from('generations')
      .insert({
        user_id: req.user.id,
        title: defaultTitle,
        prompt: prompt,
        model_id: model.id,
        model_name: model.name,
        status: 'pending',
        duration: selectedDuration,
        resolution: resolution || model.supported_resolutions?.[0] || '720p',
        aspect_ratio: aspect_ratio || model.supported_aspects?.[0] || '16:9',
        cost: estimatedCost,
        is_public: false
      })
      .select()
      .single();

    if (dbErr || !generation) {
      throw new Error(`Failed to initialize generation: ${dbErr?.message}`);
    }

    // 5. Deduct cost immediately to prevent double spending
    await creditService.deductCredits(
      req.user.id,
      estimatedCost,
      `AI Video Generation: ${model.name} (${selectedDuration}s)`,
      generation.id
    );

    // 6. Return response immediately with record ID
    res.status(202).json({
      success: true,
      message: 'Generation initiated successfully.',
      generationId: generation.id,
      estimatedCost
    });

    // 7. Dispatch fal.ai Generation in the background
    (async () => {
      try {
        // Update status to 'processing'
        await supabase
          .from('generations')
          .update({ status: 'processing' })
          .eq('id', generation.id);

        console.log(`[BackgroundWorker] Executing fal.ai job for gen: ${generation.id}`);

        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
        const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || vercelUrl || process.env.API_URL || 'http://localhost:5000'}/api/generate/webhook`;

        const result = await falService.generateVideo({
          endpoint: model.fal_endpoint,
          prompt: prompt,
          duration: selectedDuration,
          resolution: resolution || model.supported_resolutions?.[0],
          aspect_ratio: aspect_ratio || model.supported_aspects?.[0],
          generate_audio: selectedAudio,
          image_url: image_url,
          webhookUrl,
          generationId: generation.id
        });

        if (result.request_id) {
          // Store request ID in DB to track it
          await supabase
            .from('generations')
            .update({ fal_request_id: result.request_id })
            .eq('id', generation.id);
        } else if (result.video_url) {
          // Synchronous fallback success
          const placeholderThumbnail = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';
          await supabase
            .from('generations')
            .update({
              status: 'completed',
              video_url: result.video_url,
              thumbnail_url: placeholderThumbnail,
              updated_at: new Date().toISOString()
            })
            .eq('id', generation.id);

          await createNotification(
            req.user.id,
            'Video Ready! 🎬',
            `Your video generation with "${model.name}" has completed successfully.`,
            'success'
          );
        }

      } catch (err) {
        console.error(`[BackgroundWorker] Generation failed for: ${generation.id}`, err);

        // Refund user balances instantly on failure
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', req.user.id)
            .single();

          const currentCredits = parseFloat(profile.credits || 0);
          
          await supabase
            .from('profiles')
            .update({ credits: currentCredits + estimatedCost })
            .eq('id', req.user.id);

          await supabase
            .from('transactions')
            .insert({
              user_id: req.user.id,
              type: 'refund',
              amount: estimatedCost,
              description: `Refund for failed generation ${generation.id}`,
              generation_id: generation.id
            });

          console.log(`[BackgroundWorker] Successfully refunded ₹${estimatedCost} to user: ${req.user.id}`);
        } catch (refundErr) {
          console.error('[BackgroundWorker] Refund critical error:', refundErr);
        }

        // Set DB status to failed
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: err.message || 'fal.ai subscription execution timeout.',
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id);

        // Notify user about error
        await createNotification(
          req.user.id,
          'Generation Failed ❌',
          `Unable to complete video: ${err.message || 'API error.'}. Credits refunded.`,
          'error'
        );
      }
    })();

  } catch (err) {
    console.error('Express generation controller error:', err);
    res.status(500).json({ error: err.message || 'Generation request dispatcher failed.' });
  }
});

/**
 * GET /api/generate
 * Returns authenticated user's generation list (paginated)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startRange = (page - 1) * limit;
    const endRange = startRange + limit - 1;

    const { data: gens, error, count } = await supabase
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    if (error) throw error;

    // Check if user is a free tier user (no 'purchase' transactions in logs)
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
      generations: gens,
      watermarkRequired,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Failed to list generations:', err);
    res.status(500).json({ error: 'Failed to retrieve videos.' });
  }
});

/**
 * POST /api/generate/webhook
 * fal.ai calls this when generation is complete
 */
router.post('/webhook', async (req, res) => {
  try {
    const { generationId } = req.query;
    const { status, payload, error } = req.body;
    
    if (!generationId) return res.status(400).send('No generationId');

    const { data: gen } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (!gen) return res.status(404).send('Not Found');

    if (status === 'OK') {
      const videoUrl = payload?.video?.url || payload?.file?.url || payload?.outputs?.[0]?.url;
      const placeholderThumbnail = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';

      await supabase
        .from('generations')
        .update({
          status: 'completed',
          video_url: videoUrl,
          thumbnail_url: placeholderThumbnail,
          updated_at: new Date().toISOString()
        })
        .eq('id', generationId);

      await createNotification(
        gen.user_id,
        'Video Ready! 🎬',
        `Your video generation with "${gen.model_name}" has completed successfully.`,
        'success'
      );
      
      const { sendVideoReadyEmail } = require('../services/emailService');
      const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', gen.user_id).single();
      if (userProfile && userProfile.email) {
         await sendVideoReadyEmail(userProfile.email, gen.title);
      }
    } else if (status === 'ERROR') {
      // Refund
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', gen.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: parseFloat(profile.credits || 0) + gen.cost })
          .eq('id', gen.user_id);

        await supabase
          .from('transactions')
          .insert({
            user_id: gen.user_id,
            type: 'refund',
            amount: gen.cost,
            description: `Refund for failed generation ${generationId}`,
            generation_id: generationId
          });
      }

      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error || 'Generation failed on fal.ai',
          updated_at: new Date().toISOString()
        })
        .eq('id', generationId);

      await createNotification(
        gen.user_id,
        'Generation Failed ❌',
        `Unable to complete video. Credits refunded.`,
        'error'
      );
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook processing failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/generate/:id/status
 * Polling endpoint for single generation status updates
 */
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { data: gen, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation record not found.' });
    }

    // Dynamic watermark check
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
      status: gen.status,
      video_url: gen.video_url,
      thumbnail_url: gen.thumbnail_url,
      error_message: gen.error_message,
      cost: gen.cost,
      watermarkRequired
    });
  } catch (err) {
    console.error('Status polling error:', err);
    res.status(500).json({ error: 'Polling error occurred.' });
  }
});

/**
 * GET /api/generate/:id
 * Retrieve full metadata for a single video
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: gen, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation record not found.' });
    }

    // Check watermark
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
      ...gen,
      watermarkRequired
    });
  } catch (err) {
    console.error('Failed to get video detail:', err);
    res.status(500).json({ error: 'Failed to retrieve video details.' });
  }
});

/**
 * PATCH /api/generate/:id
 * Updates video details (e.g. custom renaming or public gallery status)
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  const { title, is_public } = req.body;
  const updates = {};
  
  if (title !== undefined) updates.title = title;
  if (is_public !== undefined) updates.is_public = !!is_public;

  try {
    const { data: gen, error } = await supabase
      .from('generations')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation not found or modification denied.' });
    }

    res.json(gen);
  } catch (err) {
    console.error('Update video configuration failed:', err);
    res.status(500).json({ error: 'Failed to save modifications.' });
  }
});

/**
 * DELETE /api/generate/:id
 * Deletes generation records from Supabase DB
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete generation:', err);
    res.status(500).json({ error: 'Failed to remove generation.' });
  }
});

module.exports = router;
