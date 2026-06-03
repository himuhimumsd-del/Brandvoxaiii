// server/services/notificationService.js
const supabase = require('../lib/supabase');

/**
 * Inserts a visual notification alert for a user
 * @param {string} userId - Target user UUID
 * @param {string} title - Brief summary of the event
 * @param {string} message - In-depth description
 * @param {string} [type='info'] - Severity class: 'info', 'success', 'warning', 'error'
 */
async function createNotification(userId, title, message, type = 'info') {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type
      })
      .select()
      .single();

    if (error) {
      console.error('[notificationService] Failed to push notification:', error);
    }
    return data;
  } catch (err) {
    console.error('[notificationService] Unexpected notification error:', err);
    return null;
  }
}

module.exports = { createNotification };
