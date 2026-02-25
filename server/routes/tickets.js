import express from 'express';
import Ticket from '../models/Ticket.js';
import authMiddleware from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// ─── Email transporter (lazy-init) ───────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — ticket emails will be skipped');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendTicketEmail(to, status) {
  const t = getTransporter();
  if (!t) return;

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (status === 'resolved') {
    await t.sendMail({
      from: `"Redline SMP" <${fromAddress}>`,
      to,
      subject: 'Your RedLine SMP ticket has been resolved',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#111;color:#eee;border-radius:12px;border:1px solid #333;">
          <h2 style="color:#ef4444;margin-top:0;">Ticket Resolved ✅</h2>
          <p>Hey there,</p>
          <p>Great news! Your support ticket has been reviewed and <strong style="color:#22c55e;">resolved</strong> by our team.</p>
          <p>If you have any further issues, feel free to open a new ticket or reach out on our <a href="https://discord.gg/wBNMMj2PE4" style="color:#ef4444;">Discord</a>.</p>
          <p style="margin-top:24px;color:#888;font-size:12px;">— Redline SMP Team</p>
        </div>
      `,
    });
  } else if (status === 'declined') {
    await t.sendMail({
      from: `"Redline SMP" <${fromAddress}>`,
      to,
      subject: 'Your RedLine SMP ticket update',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#111;color:#eee;border-radius:12px;border:1px solid #333;">
          <h2 style="color:#ef4444;margin-top:0;">Ticket Update</h2>
          <p>Hey there,</p>
          <p>After reviewing your support ticket, our team was unable to take action on this request at this time.</p>
          <p>If you believe this was in error or need further assistance, please don't hesitate to open a new ticket or contact us on <a href="https://discord.gg/wBNMMj2PE4" style="color:#ef4444;">Discord</a>.</p>
          <p style="margin-top:24px;color:#888;font-size:12px;">— Redline SMP Team</p>
        </div>
      `,
    });
  }
}

// ─── PUBLIC: Create ticket ────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { email, category, message } = req.body;

    if (!email || !category || !message) {
      return res.status(400).json({ message: 'Email, category, and message are required.' });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    await Ticket.create({ email: email.trim(), category: category.trim(), message: message.trim() });
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

    // Send email notification (fire & forget)
    sendTicketEmail(ticket.email, status).catch((err) =>
      console.error('Failed to send ticket email:', err.message)
    );

    res.json({ success: true, ticket });
  } catch (err) {
    console.error('Ticket status update error:', err);
    res.status(500).json({ message: 'Failed to update ticket.' });
  }
});

export default router;
