import { Router } from 'express';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// ─── ADMIN ROUTES (must be before /:id to avoid param conflicts) ─────────

// GET /api/products/admin/all - all products (including inactive)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('collection', 'name slug')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/homepage - get featured products grouped by collection
router.get('/homepage', async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ order: 1 });
    const result = [];

    for (const col of collections) {
      const products = await Product.find({
        collection: col._id,
        isActive: true,
      }).sort({ order: 1 }).limit(3);

      if (products.length > 0) {
        result.push({
          collection: col,
          products,
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUBLIC ROUTES ────────────────────────────────────────

// GET /api/products - list active products (with optional collection filter)
router.get('/', async (req, res) => {
  try {
    const { collection, featured, limit } = req.query;
    const filter = { isActive: true };

    if (collection) {
      const col = await Collection.findOne({ slug: collection });
      if (col) filter.collection = col._id;
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    let query = Product.find(filter).populate('collection', 'name slug').sort({ order: 1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id - single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('collection', 'name slug');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products - create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, price, image, features, collection, isFeatured, order } = req.body;
    
    const col = await Collection.findById(collection);
    if (!col) {
      return res.status(400).json({ message: 'Invalid collection' });
    }

    const product = await Product.create({
      title, price, image, features, collection, isFeatured, order,
    });

    const populated = await product.populate('collection', 'name slug');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/products/:id - update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, price, image, features, collection, isActive, isFeatured, order } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (price !== undefined) updateData.price = price;
    if (image !== undefined) updateData.image = image;
    if (features !== undefined) updateData.features = features;
    if (collection !== undefined) updateData.collection = collection;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (order !== undefined) updateData.order = order;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('collection', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/products/:id/toggle - toggle active status
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    const populated = await product.populate('collection', 'name slug');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
