// ─── Discord Webhook Utility ──────────────────────────────
// Posts embeds to a Discord webhook URL.
// Configure DISCORD_WEBHOOK_URL in server/.env

/**
 * Send a Discord webhook embed.
 * @param {{ title: string, description?: string, color?: number, fields?: {name:string,value:string,inline?:boolean}[], url?: string }} embed
 * @returns {Promise<boolean>}
 */
export async function sendDiscordWebhook(embed) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('[Discord] Skipped — DISCORD_WEBHOOK_URL not set');
    return false;
  }

  try {
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
      const text = await res.text();
      console.error(`[Discord] ❌ Webhook failed (${res.status}):`, text);
      return false;
    }

    console.log(`[Discord] ✅ Webhook sent: ${embed.title}`);
    return true;
  } catch (err) {
    console.error('[Discord] ❌ Webhook error:', err.message);
    return false;
  }
}

// ─── Pre-built referral embeds ────────────────────────────

export function referralApplicationEmbed({ creatorName, email, minecraftUsername, discordId, channelLink }) {
  return {
    title: '📋 New Referral Application',
    color: 0xef4444, // red
    fields: [
      { name: 'Creator', value: creatorName, inline: true },
      { name: 'Email', value: email, inline: true },
      { name: 'Minecraft', value: minecraftUsername, inline: true },
      { name: 'Discord ID', value: discordId, inline: true },
      { name: 'Channel', value: channelLink, inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Review in Admin Panel → Referrals tab' },
  };
}

export function referralApprovedEmbed({ creatorName, referralCode, discountPercent, commissionPercent, reviewedBy }) {
  return {
    title: '✅ Referral Application Approved',
    color: 0x22c55e, // green
    fields: [
      { name: 'Creator', value: creatorName, inline: true },
      { name: 'Code', value: `\`${referralCode}\``, inline: true },
      { name: 'Discount', value: `${discountPercent}%`, inline: true },
      { name: 'Commission', value: `${commissionPercent}%`, inline: true },
      ...(reviewedBy ? [{ name: 'Approved By', value: reviewedBy, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
  };
}

export function referralRejectedEmbed({ creatorName, reviewedBy }) {
  return {
    title: '❌ Referral Application Rejected',
    color: 0xef4444,
    fields: [
      { name: 'Creator', value: creatorName, inline: true },
      ...(reviewedBy ? [{ name: 'Rejected By', value: reviewedBy, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
  };
}

export function payoutProcessedEmbed({ creatorName, referralCode, amount, remainingBalance, processedBy }) {
  return {
    title: '💸 Payout Processed',
    color: 0x22c55e,
    fields: [
      { name: 'Creator', value: creatorName, inline: true },
      { name: 'Code', value: `\`${referralCode}\``, inline: true },
      { name: 'Amount', value: `₹${amount}`, inline: true },
      { name: 'Remaining', value: `₹${remainingBalance}`, inline: true },
      ...(processedBy ? [{ name: 'Processed By', value: processedBy, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
  };
}
