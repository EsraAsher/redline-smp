/**
 * Settings Routes — Global configuration
 *
 * GET  /api/settings/public    → public-facing settings (threshold etc.)
 * GET  /api/settings           → admin: full settings
 * PATCH /api/settings          → admin: update settings
 */
import { Router } from 'express';
import Settings, { getSettings } from '../models/Settings.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// ─── Public (used by creator dashboard) ──────────────────
router.get('/public', async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      globalPayoutThreshold: s.globalPayoutThreshold,
    });
  } catch (err) {
    console.error('[Settings] Public fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Admin: get settings ─────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const s = await getSettings();
    res.json(s);
  } catch (err) {
    console.error('[Settings] Fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Admin: update settings ──────────────────────────────
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const { globalPayoutThreshold } = req.body;
    const updates = {};

    if (globalPayoutThreshold !== undefined) {
      const val = Number(globalPayoutThreshold);
      if (!Number.isFinite(val) || val < 1) {
        return res.status(400).json({ message: 'Threshold must be a positive number.' });
      }
      updates.globalPayoutThreshold = val;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    const s = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({ message: 'Settings updated.', settings: s });
  } catch (err) {
    console.error('[Settings] Update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
