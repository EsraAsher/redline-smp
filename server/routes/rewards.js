import { Router } from 'express';
import Order from '../models/Order.js';

const router = Router();

// GET /api/rewards/pending?username=<playerName>
// Called by Minecraft plugin to fetch pending paid rewards for a player.
router.get('/pending', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, message: 'username is required' });
    }

    const orders = await Order.find({
      mcUsername: username,
      paymentStatus: 'paid',
      webhookVerified: true,
      deliveryStatus: 'pending',
    }).select('_id items');

    res.json({
      success: true,
      rewards: orders.map((order) => ({
        orderId: order._id,
        items: order.items,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// POST /api/rewards/mark-delivered
// Called by Minecraft plugin after successful command execution.
router.post('/mark-delivered', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const serverSecret = process.env.SERVER_SECRET;

    if (!serverSecret) {
      return res.status(500).json({ success: false });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false });
    }

    const token = authHeader.split(' ')[1];
    if (token !== serverSecret) {
      return res.status(401).json({ success: false });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Idempotent — already delivered, return success without modifying
    if (order.deliveryStatus === 'delivered') {
      return res.json({ success: true });
    }

    if (order.deliveryStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order is not pending delivery' });
    }

    order.deliveryStatus = 'delivered';
    order.deliveredAt = new Date();
    order.deliveryLog.push(`Delivered at ${new Date().toISOString()}`);
    await order.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

export default router;
