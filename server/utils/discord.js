/**
 * Discord Webhook Utility
 * ────────────────────────
 * sendDiscordEvent(type, data) — routes each event to its own webhook channel.
 *
 * All failures are non-fatal. Missing webhook URLs are silently skipped.
 *
 * Event types → env var mapping:
 *   purchase              → DISCORD_WEBHOOK_PUBLIC_PURCHASES
 *   referral_application  → DISCORD_WEBHOOK_SUPPORT_APPLICATIONS
 *   referral_approved     → DISCORD_WEBHOOK_SUPPORT_APPROVALS
 *   referral_rejected     → DISCORD_WEBHOOK_SUPPORT_REJECTIONS
 *   fraud_alert           → DISCORD_WEBHOOK_SUPPORT_FRAUD
 *   payout_processed      → DISCORD_WEBHOOK_SUPPORT_PAYOUTS
 */

// ─── Webhook URL map ──────────────────────────────────────
const WEBHOOK_MAP = {
  purchase:             'DISCORD_WEBHOOK_PUBLIC_PURCHASES',
  referral_application: 'DISCORD_WEBHOOK_SUPPORT_APPLICATIONS',
  referral_approved:    'DISCORD_WEBHOOK_SUPPORT_APPROVALS',
  referral_rejected:    'DISCORD_WEBHOOK_SUPPORT_REJECTIONS',
  fraud_alert:          'DISCORD_WEBHOOK_SUPPORT_FRAUD',
  payout_processed:     'DISCORD_WEBHOOK_SUPPORT_PAYOUTS',
};

// ─── Embed builders ───────────────────────────────────────
function buildEmbed(type, data) {
  switch (type) {

    case 'purchase':
      return {
        title: '🛒 New Purchase',
        color: 0x3b82f6,
        fields: [
          { name: 'Player', value: data.mcUsername || '—', inline: true },
          { name: 'Total', value: `₹${data.total}`, inline: true },
          ...(data.referralCode ? [{ name: 'Referral Code', value: `\`${data.referralCode}\``, inline: true }] : []),
          ...(data.items?.length ? [{ name: 'Items', value: data.items.join(', '), inline: false }] : []),
        ],
        timestamp: new Date().toISOString(),
      };

    case 'referral_application':
      return {
        title: '📋 New Referral Application',
        color: 0xef4444,
        fields: [
          { name: 'Creator', value: data.creatorName, inline: true },
          { name: 'Email', value: data.email, inline: true },
          { name: 'Minecraft', value: data.minecraftUsername || '—', inline: true },
          { name: 'Discord ID', value: data.discordId || '—', inline: true },
          ...(data.channelLink ? [{ name: 'Channel', value: data.channelLink, inline: false }] : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Review in Admin Panel → Referrals tab' },
      };

    case 'referral_approved':
      return {
        title: '✅ Referral Application Approved',
        color: 0x22c55e,
        fields: [
          { name: 'Creator', value: data.creatorName, inline: true },
          { name: 'Code', value: `\`${data.referralCode}\``, inline: true },
          { name: 'Discount', value: `${data.discountPercent}%`, inline: true },
          { name: 'Commission', value: `${data.commissionPercent}%`, inline: true },
          ...(data.reviewedBy ? [{ name: 'Approved By', value: data.reviewedBy, inline: true }] : []),
        ],
        timestamp: new Date().toISOString(),
      };

    case 'referral_rejected':
      return {
        title: '❌ Referral Application Rejected',
        color: 0xef4444,
        fields: [
          { name: 'Creator', value: data.creatorName, inline: true },
          ...(data.reviewedBy ? [{ name: 'Rejected By', value: data.reviewedBy, inline: true }] : []),
        ],
        timestamp: new Date().toISOString(),
      };

    case 'fraud_alert':
      return {
        title: '⚠️ Fraud Alert',
        color: 0xf97316,
        fields: [
          { name: 'Code', value: `\`${data.referralCode}\``, inline: true },
          { name: 'Type', value: data.type || '—', inline: true },
          ...(data.ip ? [{ name: 'IP', value: data.ip, inline: true }] : []),
          ...(data.email ? [{ name: 'Email', value: data.email, inline: true }] : []),
          ...(data.details ? [{ name: 'Details', value: data.details, inline: false }] : []),
        ],
        timestamp: new Date().toISOString(),
      };

    case 'payout_processed':
      return {
        title: '💸 Payout Processed',
        color: 0x22c55e,
        fields: [
          { name: 'Creator', value: data.creatorName, inline: true },
          { name: 'Code', value: `\`${data.referralCode}\``, inline: true },
          { name: 'Amount', value: `₹${data.amount}`, inline: true },
          { name: 'Remaining', value: `₹${data.remainingBalance}`, inline: true },
          ...(data.processedBy ? [{ name: 'Processed By', value: data.processedBy, inline: true }] : []),
        ],
        timestamp: new Date().toISOString(),
      };

    default:
      return { title: type, color: 0x6b7280, fields: [], timestamp: new Date().toISOString() };
  }
}

// ─── Internal send ────────────────────────────────────────
async function postWebhook(url, embed) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Redline SMP',
      avatar_url: 'https://store.redlinesmp.fun/favicon.ico',
      embeds: [embed],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text}`);
  }
}

// ─── Public API ───────────────────────────────────────────

/**
 * Send a Discord event notification to the appropriate webhook channel.
 * Non-fatal — never throws. Missing webhook URLs are silently skipped.
 *
 * @param {'purchase'|'referral_application'|'referral_approved'|'referral_rejected'|'fraud_alert'|'payout_processed'} type
 * @param {object} data
 */
export async function sendDiscordEvent(type, data) {
  try {
    const envKey = WEBHOOK_MAP[type];
    if (!envKey) {
      console.warn(`[Discord] Unknown event type: ${type}`);
      return;
    }
    const url = process.env[envKey];
    if (!url) return; // webhook not configured — skip silently
    const embed = buildEmbed(type, data);
    await postWebhook(url, embed);
    console.log(`[Discord] ✅ ${type} → ${envKey}`);
  } catch (err) {
    console.error(`[Discord] ❌ Failed to send ${type}:`, err.message);
  }
}
