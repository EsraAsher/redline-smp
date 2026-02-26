/**
 * Backend API Service
 * ────────────────────
 * All data access goes through the backend REST API.
 * The bot NEVER connects to MongoDB directly.
 */

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, '');
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET;

if (!BACKEND_BASE_URL) throw new Error('BACKEND_BASE_URL is not set.');
if (!BOT_INTERNAL_SECRET) throw new Error('BOT_INTERNAL_SECRET is not set.');

/**
 * Internal fetch wrapper — attaches bot secret header.
 */
async function botFetch(path) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    headers: { 'x-bot-secret': BOT_INTERNAL_SECRET },
  });
  return res;
}

/**
 * Fetch referral stats for a Discord user.
 * @param {string} discordId
 * @returns {Promise<object|null>} Partner data or null if not found.
 */
export async function fetchReferralStats(discordId) {
  const res = await botFetch(`/api/bot/referral/${discordId}`);

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Backend ${res.status}: ${body}`);
  }

  return res.json();
}
