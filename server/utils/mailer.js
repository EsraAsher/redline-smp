import nodemailer from 'nodemailer';

// ─── Lazy-initialised SMTP transporter ────────────────────
let transporter = null;
let smtpVerified = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — emails will be skipped');
    console.warn('   Missing:', [
      !SMTP_HOST && 'SMTP_HOST',
      !SMTP_USER && 'SMTP_USER',
      !SMTP_PASS && 'SMTP_PASS',
    ].filter(Boolean).join(', '));
    return null;
  }

  const port = parseInt(SMTP_PORT) || 587;
  const isSSL = port === 465;

  console.log(`[Mailer] Creating transporter → ${SMTP_HOST}:${port} (${isSSL ? 'SSL' : 'STARTTLS'}), user=${SMTP_USER}`);

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: isSSL,           // true for 465 (SSL), false for 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },   // accept self-signed / chain certs
    connectionTimeout: 10000,             // 10s connect timeout
    greetingTimeout: 10000,               // 10s greeting timeout
    socketTimeout: 15000,                 // 15s socket timeout
  });

  // Verify SMTP connection on first init (async, non-blocking)
  transporter.verify()
    .then(() => {
      smtpVerified = true;
      console.log('[Mailer] ✅ SMTP connection verified successfully');
    })
    .catch((err) => {
      console.error('[Mailer] ❌ SMTP verification FAILED:', err.message);
      console.error('[Mailer]    Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS on Render');
    });

  return transporter;
}

// ─── SMTP health check (for test endpoint) ────────────────
export async function verifySMTP() {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'SMTP not configured — missing env vars' };

  try {
    await t.verify();
    return { ok: true, host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER };
  } catch (err) {
    return { ok: false, error: err.message, host: process.env.SMTP_HOST, port: process.env.SMTP_PORT };
  }
}

// ─── Reusable sendMail helper ─────────────────────────────
// Returns true on success, false on failure (never throws).
export async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[Mailer] Skipped email to ${to} — no transporter`);
    return false;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await t.sendMail({
      from: `"Redline SMP" <${fromAddress}>`,
      to,
      replyTo: process.env.SMTP_USER,
      subject,
      html,
      headers: {
        'X-Mailer': 'RedlineSMP-Tickets',
        'List-Unsubscribe': `<mailto:${fromAddress}?subject=unsubscribe>`,
      },
    });
    console.log(`[Mailer] ✅ Sent to ${to} | subject="${subject}" | messageId=${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Mailer] ❌ Failed to send to ${to}:`, err.message);
    console.error(`[Mailer]    Code: ${err.code || 'N/A'} | Command: ${err.command || 'N/A'}`);
    return false;
  }
}

// ─── HTML email wrapper ───────────────────────────────────
function wrap(body) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#111;border:1px solid #333;border-radius:12px;overflow:hidden;">
    <!-- Header -->
    <div style="background:#1a1a1a;padding:20px 24px;border-bottom:1px solid #333;text-align:center;">
      <span style="font-size:18px;font-weight:700;color:#ef4444;letter-spacing:2px;">REDLINE SMP</span>
    </div>
    <!-- Body -->
    <div style="padding:24px;color:#e5e5e5;font-size:14px;line-height:1.7;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="padding:16px 24px;border-top:1px solid #333;text-align:center;font-size:11px;color:#666;">
      Redline SMP &middot; mc.redlinesmp.fun &middot;
      <a href="https://discord.gg/wBNMMj2PE4" style="color:#ef4444;text-decoration:none;">Discord</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Pre-built ticket email templates ─────────────────────

export function ticketCreatedUserHTML({ ticketId, username, category, messagePreview, timestamp }) {
  return wrap(`
    <h2 style="color:#ef4444;margin:0 0 16px;">Ticket Received</h2>
    <p>Hey <strong>${username || 'there'}</strong>,</p>
    <p>We've received your support ticket and our team will review it shortly.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Ticket ID</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;font-family:monospace;">${ticketId}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Username</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;">${username || '—'}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Category</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;">${category}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;">Submitted</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;">${timestamp}</td></tr>
    </table>

    <p style="color:#aaa;font-size:13px;"><em>"${messagePreview}"</em></p>
    <p>You'll receive an email update when the status of your ticket changes.</p>
  `);
}

export function ticketCreatedAdminHTML({ ticketId, email, username, category, message, timestamp }) {
  return wrap(`
    <h2 style="color:#ef4444;margin:0 0 16px;">New Support Ticket</h2>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Ticket ID</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;font-family:monospace;">${ticketId}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Email</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;">${email}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Username</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;">${username || '—'}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;border-bottom:1px solid #222;">Category</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;border-bottom:1px solid #222;">${category}</td></tr>
      <tr><td style="padding:8px 12px;color:#888;font-size:12px;">Submitted</td>
          <td style="padding:8px 12px;color:#fff;font-size:12px;">${timestamp}</td></tr>
    </table>

    <div style="background:#0d0d0d;border:1px solid #222;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#aaa;font-size:13px;margin:0;white-space:pre-wrap;">${message}</p>
    </div>
  `);
}

export function ticketResolvedHTML({ ticketId, username }) {
  return wrap(`
    <h2 style="color:#22c55e;margin:0 0 16px;">Ticket Resolved</h2>
    <p>Hey <strong>${username || 'there'}</strong>,</p>
    <p>Your support ticket <span style="font-family:monospace;color:#fff;">${ticketId}</span> has been reviewed and <strong style="color:#22c55e;">resolved</strong> by our team.</p>
    <p>If you have any further issues, feel free to open a new ticket or reach out on our Discord.</p>
  `);
}

export function ticketDeclinedHTML({ ticketId, username }) {
  return wrap(`
    <h2 style="color:#ef4444;margin:0 0 16px;">Ticket Update</h2>
    <p>Hey <strong>${username || 'there'}</strong>,</p>
    <p>After reviewing your support ticket <span style="font-family:monospace;color:#fff;">${ticketId}</span>, our team was unable to take action on this request at this time.</p>
    <p>If you believe this was in error or need further assistance, please don't hesitate to open a new ticket or contact us on Discord.</p>
  `);
}
