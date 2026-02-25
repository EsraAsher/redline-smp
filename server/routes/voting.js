import express from 'express';
import VotingSite from '../models/VotingSite.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// ─── Public: Get active voting sites ──────────────────────
router.get('/', async (req, res) => {
  try {
    const sites = await VotingSite.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch voting sites' });
  }
});

// ─── Admin: All voting sites ──────────────────────────────
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const sites = await VotingSite.find().sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch voting sites' });
  }
});

// ─── Admin: Create voting site ────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, url } = req.body;
    if (!name || !url) return res.status(400).json({ message: 'Name and URL are required' });
    const site = await VotingSite.create({ name, description, url });
    res.status(201).json(site);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create voting site' });
  }
});

// ─── Admin: Update voting site ────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, url } = req.body;
    const site = await VotingSite.findByIdAndUpdate(
      req.params.id,
      { name, description, url },
      { new: true }
    );
    if (!site) return res.status(404).json({ message: 'Voting site not found' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update voting site' });
  }
});

// ─── Admin: Toggle active status ──────────────────────────
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const site = await VotingSite.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Voting site not found' });
    site.isActive = !site.isActive;
    await site.save();
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle voting site' });
  }
});

// ─── Admin: Delete voting site ────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const site = await VotingSite.findByIdAndDelete(req.params.id);
    if (!site) return res.status(404).json({ message: 'Voting site not found' });
    res.json({ message: 'Voting site deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete voting site' });
  }
});

export default router;
