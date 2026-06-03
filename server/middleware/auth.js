// server/middleware/auth.js
const supabase = require('../lib/supabase');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: Missing token' });

  try {
    // Validate JWT token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Retrieve user profile to confirm status and permissions
    let { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_banned, role, credits')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) {
      console.error('[AuthMiddleware] Error fetching profile:', profileErr);
    }

    if (!profile) {
      console.log(`[AuthMiddleware] Profile not found for registered user ${user.id}. Performing self-healing auto-creation...`);
      
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      
      // Auto-insert profile row
      const { data: newProfile, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: 'user',
          credits: 50.00
        })
        .select('is_banned, role, credits')
        .single();

      if (insertErr || !newProfile) {
        console.error('[AuthMiddleware] Self-healing profile insertion failed:', insertErr);
        return res.status(401).json({ error: 'User profile mismatch. Complete registration first.' });
      }

      profile = newProfile;

      // Log welcome credits transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'admin_grant',
          amount: 50.00,
          description: 'Welcome free signup credits (restored session bonus)'
        });

      // Insert welcome notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Welcome to BrandVox AI!',
          message: 'Your profile has been synchronized successfully. You have been granted ₹50.00 free credits to start generating cinematic videos!',
          type: 'success'
        });
    }

    // Block banned users immediately
    if (profile.is_banned) {
      return res.status(403).json({ error: 'Access denied: This account has been banned.' });
    }

    // Inject verified user metadata into request context
    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      credits: parseFloat(profile.credits)
    };

    next();
  } catch (err) {
    console.error('Authentication Error:', err);
    return res.status(500).json({ error: 'Internal authentication server error' });
  }
};
