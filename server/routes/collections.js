import { Router } from 'express';
import Collection from '../models/Collection.js';
import Product from '../models/Product.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// ─── ADMIN ROUTES (must be before /:slug to avoid param conflicts) ─────────

// GET /api/collections/admin/all - list ALL collections (including inactive)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const collections = await Collection.find().sort({ order: 1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUBLIC ROUTES ────────────────────────────────────────

// GET /api/collections - list all active collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ order: 1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/collections/:slug - get collection with its products
router.get('/:slug', async (req, res) => {
  try {
    const collection = await Collection.findOne({ slug: req.params.slug, isActive: true });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const products = await Product.find({
      collection: collection._id,
      isActive: true,
    }).sort({ order: 1 });

    res.json({ collection, products });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN CRUD ROUTES ────────────────────────────────────

// POST /api/collections - create collection
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const collection = await Collection.create({ name, slug, description, order });
    res.status(201).json(collection);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Collection name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/collections/:id - update collection
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, isActive, order } = req.body;
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/collections/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ collection: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete collection with ${productCount} product(s). Remove or reassign them first.`,
      });
    }

    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json({ message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
