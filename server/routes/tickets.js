import express from 'express';
import Ticket from '../models/Ticket.js';
import authMiddleware from '../middleware/auth.js';
import {
  sendMail,
  ticketCreatedUserHTML,
  ticketCreatedAdminHTML,
  ticketResolvedHTML,
  ticketDeclinedHTML,
} from '../utils/mailer.js';

const router = express.Router();
const ADMIN_EMAIL = 'tickets@redlinesmp.fun';

// ─── Helper: truncate for preview ─────────────────────────
function preview(text, len = 120) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '…' : text;
}

// ─── PUBLIC: Create ticket ────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { email, username, category, message } = req.body;

    if (!email || !category || !message) {
      return res.status(400).json({ message: 'Email, category, and message are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    const ticket = await Ticket.create({
      email: email.trim(),
      username: (username || '').trim(),
      category: category.trim(),
      message: message.trim(),
    });

    // Fire-and-forget emails (never block the response)
    const emailData = {
      ticketId: ticket._id.toString(),
      email: ticket.email,
      username: ticket.username,
      category: ticket.category,
      message: ticket.message,
      messagePreview: preview(ticket.message),
      timestamp: ticket.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    // 1) Confirmation to user
    sendMail({
      to: ticket.email,
      subject: `Ticket Received — ${ticket.category}`,
      html: ticketCreatedUserHTML(emailData),
    });

    // 2) Notification to admin
    sendMail({
      to: ADMIN_EMAIL,
      subject: `New Ticket: ${ticket.category} — ${ticket.username || ticket.email}`,
      html: ticketCreatedAdminHTML(emailData),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Ticket create error:', err);
    res.status(500).json({ message: 'Failed to create ticket.' });
  }
});

// ─── ADMIN: List all tickets ──────────────────────────────
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('Ticket list error:', err);
    res.status(500).json({ message: 'Failed to fetch tickets.' });
  }
});

// ─── ADMIN: Update ticket status ──────────────────────────
router.patch('/admin/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['resolved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "resolved" or "declined".' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Fire-and-forget status email
    const tplData = {
      ticketId: ticket._id.toString(),
      username: ticket.username,
    };

    if (status === 'resolved') {
      sendMail({
        to: ticket.email,
        subject: 'Your Redline SMP ticket has been resolved',
        html: ticketResolvedHTML(tplData),
      });
    } else if (status === 'declined') {
      sendMail({
        to: ticket.email,
        subject: 'Your Redline SMP ticket update',
        html: ticketDeclinedHTML(tplData),
      });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    console.error('Ticket status update error:', err);
    res.status(500).json({ message: 'Failed to update ticket.' });
  }
});

export default router;
