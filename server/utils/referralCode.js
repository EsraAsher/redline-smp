import ReferralPartner from '../models/ReferralPartner.js';

/**
 * generates a unique referral code based on the creator's name.
 * Tries up to 10 random suffixes before falling back to a timestamp-based code.
 */
export async function generateUniqueCode(baseName) {
  const prefix = baseName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'REDLINE';

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `${prefix}${suffix}`;
    const exists = await ReferralPartner.findOne({ referralCode: code });
    if (!exists) return code;
  }
  // Fallback: timestamp-based
  return `RL${Date.now().toString(36).toUpperCase()}`;
}
