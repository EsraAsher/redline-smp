/**
 * Backend API client for the bot.
 * All data access goes through the backend REST API — never touches DB directly.
 */

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, '');
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET;

if (!BACKEND_BASE_URL) {
  throw new Error('BACKEND_BASE_URL is not set in environment.');
}
if (!BOT_INTERNAL_SECRET) {
  throw new Error('BOT_INTERNAL_SECRET is not set in environment.');
}

/**
 * Fetch referral stats for a Discord user from the backend.
 * @param {string} discordId
 * @returns {Promise<object|null>} Partner data or null if not found
 */
export async function fetchReferralStats(discordId) {
  const res = await fetch(`${BACKEND_BASE_URL}/api/bot/referral/${discordId}`, {
    headers: {
      'x-bot-secret': BOT_INTERNAL_SECRET,
    },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Backend returned ${res.status}: ${body}`);
  }

  return res.json();
}
