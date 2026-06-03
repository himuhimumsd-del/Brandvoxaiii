// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const supabase = require('../lib/supabase');

/**
 * GET /api/auth/me
 * Retrieves current active profile metadata (including current credit scores, privileges, and ban details)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile ledger entry not found.' });
    }

    // Verify ban flag once more
    if (profile.is_banned) {
      return res.status(403).json({ error: 'Your account is banned.' });
    }

    res.json(profile);
  } catch (err) {
    console.error('[authRouter] Error in /me endpoint:', err);
    res.status(500).json({ error: 'Failed to pull current profile session.' });
  }
});

module.exports = router;
