// server/routes/credits.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const supabase = require('../lib/supabase');

// Load configurations
require('dotenv').config({ path: '../.env' });

/**
 * GET /api/credits/balance
 * Returns user's credit balance and total statistics
 */
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits, total_spent, total_videos, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      credits: parseFloat(profile.credits),
      total_spent: parseFloat(profile.total_spent),
      total_videos: parseInt(profile.total_videos),
      created_at: profile.created_at
    });
  } catch (err) {
    console.error('Error fetching balance:', err);
    res.status(500).json({ error: 'Failed to retrieve balance information' });
  }
});

/**
 * GET /api/credits/transactions
 * Returns paginated list of transaction logs for the authenticated user
 */
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startRange = (page - 1) * limit;
    const endRange = startRange + limit - 1;

    const { data: txs, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    if (error) throw error;

    res.json({
      transactions: txs,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve billing logs' });
  }
});

/**
 * GET /api/credits/upi-submissions
 * Returns user's own manual UPI submissions history
 */
router.get('/upi-submissions', authMiddleware, async (req, res) => {
  try {
    const { data: submissions, error } = await supabase
      .from('upi_submissions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(submissions || []);
  } catch (err) {
    console.error('[CreditsRouter] Error fetching upi submissions:', err);
    res.status(500).json({ error: 'Failed to retrieve payment submissions.' });
  }
});

/**
 * POST /api/credits/upi-submit
 * Submits a new manual UPI payment verification request
 */
router.post('/upi-submit', authMiddleware, async (req, res) => {
  const { utr_id, email, package_id, screenshot_url } = req.body;

  if (!utr_id || !email || !package_id) {
    return res.status(400).json({ error: 'UTR Transaction ID, Email, and Package size are required.' });
  }

  // Enforce UTR structure (typically 12-digit number for UPI)
  const utrClean = String(utr_id).trim();
  if (utrClean.length < 6 || utrClean.length > 20 || !/^[A-Za-z0-9]+$/.test(utrClean)) {
    return res.status(400).json({ error: 'Please enter a valid Transaction / UTR reference number.' });
  }

  // Approved Packages
  const packages = {
    starter: { price: 99, name: 'Starter Pack' },
    creator: { price: 249, name: 'Creator Pack' },
    pro:     { price: 499, name: 'Pro Pack' },
    studio:  { price: 999, name: 'Studio Pack' }
  };

  const pkg = packages[package_id];
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid credit package selected.' });
  }

  try {
    // 1. Prevent duplicate submission of the same UTR ID
    const { data: existing, error: findErr } = await supabase
      .from('upi_submissions')
      .select('id, status')
      .eq('utr_id', utrClean)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ 
        error: `This Transaction / UTR ID has already been logged. Status: ${existing.status.toUpperCase()}.` 
      });
    }

    // 2. Insert record in 'pending' status
    const { data: submission, error: insertErr } = await supabase
      .from('upi_submissions')
      .insert({
        user_id: req.user.id,
        email: String(email).trim().toLowerCase(),
        utr_id: utrClean,
        package_id,
        amount: pkg.price,
        screenshot_url: screenshot_url || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertErr || !submission) {
      throw new Error(insertErr?.message || 'DB insertion failed.');
    }

    // 3. Insert user notification
    const { createNotification } = require('../services/notificationService');
    await createNotification(
      req.user.id,
      'Payment Submitted! 💳',
      `Manual UPI payment verification requested for UTR ID: ${utrClean}. Our team will verify it shortly.`,
      'info'
    );

    res.json({
      success: true,
      message: 'Your payment details have been submitted. Our administrators are manually verifying it.',
      submission
    });
  } catch (err) {
    console.error('[CreditsRouter] UPI submit error:', err);
    res.status(500).json({ error: 'Failed to record manual payment submission. Please contact support.' });
  }
});

module.exports = router;
