import { Router } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Collection from '../models/Collection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// All analytics routes require auth
router.use(authMiddleware);

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const totalCollections = await Collection.countDocuments();

    const orders = await Order.find({ status: { $in: ['completed', 'paid', 'delivered'] } });
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalItemsSold = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    res.json({
      totalProducts,
      activeProducts,
      totalCollections,
      totalSales,
      totalRevenue,
      totalItemsSold,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/products - per-product sales
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('collection', 'name slug')
      .sort({ totalSold: -1 });

    const stats = products.map((p) => ({
      _id: p._id,
      title: p.title,
      collection: p.collection?.name || 'Unknown',
      price: p.price,
      totalSold: p.totalSold,
      totalRevenue: p.totalRevenue,
      isActive: p.isActive,
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/recent-orders
router.get('/recent-orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('items.product', 'title');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
