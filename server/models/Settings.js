import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Singleton key — always 'global'
  key: {
    type: String,
    default: 'global',
    unique: true,
  },

  // ─── Payout Settings ─────────────────────────────────────
  globalPayoutThreshold: {
    type: Number,
    default: 300,
    min: 1,
  },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

/**
 * Get the global settings document (creates default if missing).
 * Cached per request — safe to call multiple times.
 */
export async function getSettings() {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = await Settings.create({ key: 'global' });
  }
  return settings;
}

export default Settings;
