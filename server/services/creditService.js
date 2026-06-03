// server/services/creditService.js
const supabase = require('../lib/supabase');

/**
 * Deducts credit amount from user balance and logs usage transactions
 * @param {string} userId - UUID of profile to charge
 * @param {number} amount - Cost in INR to deduct
 * @param {string} description - Log message
 * @param {string} [generationId] - Associated generation ID
 */
async function deductCredits(userId, amount, description, generationId) {
  // Fetch current user balances securely
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits, total_spent, total_videos')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('User profile not found in ledger.');
  }

  const currentCredits = parseFloat(profile.credits || 0);
  if (currentCredits < amount) {
    throw new Error('Insufficient credit balance for this operation.');
  }

  const newCredits = currentCredits - amount;
  const newSpent = parseFloat(profile.total_spent || 0) + amount;
  const newVideos = parseInt(profile.total_videos || 0) + 1;

  // Deduct profile balances
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      credits: newCredits,
      total_spent: newSpent,
      total_videos: newVideos,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateErr) {
    throw new Error(`Balance deduction failed: ${updateErr.message}`);
  }

  // Create usage transaction
  const { error: txErr } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'usage',
      amount: -amount,
      description,
      generation_id: generationId || null
    });

  if (txErr) {
    console.error('[creditService] Warning: Failed to record usage transaction:', txErr);
  }
}

/**
 * Awards credit amount to user balance and logs purchase records
 * @param {string} userId - UUID of profile
 * @param {number} amount - Value in INR to credit
 * @param {string} description - Purchase description
 * @param {string} gatewayPaymentId - Gateway payment hash/ID
 * @param {string} gatewayOrderId - Gateway order hash/ID
 * @param {string} [gatewayName='cashfree'] - Name of the gateway
 */
async function addCredits(userId, amount, description, gatewayPaymentId, gatewayOrderId, gatewayName = 'cashfree') {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('User profile not found in ledger.');
  }

  const newCredits = parseFloat(profile.credits || 0) + amount;

  // Credit profile balances
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateErr) {
    throw new Error(`Credit adjustment failed: ${updateErr.message}`);
  }

  // Log transaction details
  const { error: txErr } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'purchase',
      amount,
      description,
      gateway_payment_id: gatewayPaymentId,
      gateway_order_id: gatewayOrderId,
      gateway_name: gatewayName
    });

  if (txErr) {
    console.error('[creditService] Warning: Failed to record purchase transaction:', txErr);
  }
}

module.exports = { deductCredits, addCredits };
