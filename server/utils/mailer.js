import { Resend } from 'resend';

// ─── Lazy-initialised Resend client ───────────────────────
let resend = null;

function getClient() {
  if (resend) return resend;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('⚠️  RESEND_API_KEY not set — emails will be skipped');
    return null;
  }

  resend = new Resend(key);
  console.log('[Mailer] Resend client initialised');
  return resend;
}

// ─── Health check (for test endpoint) ─────────────────────
export async function verifyEmail() {
  const client = getClient();
  if (!client) return { ok: false, error: 'RESEND_API_KEY not configured' };

  try {
    // List domains to verify the API key works
    const { data, error } = await client.domains.list();
    if (error) return { ok: false, error: error.message };
    const domains = (data || []).map(d => d.name);
    return { ok: true, domains };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ─── Reusable sendMail helper ─────────────────────────────
// Returns true on success, false on failure (never throws).
export async function sendMail({ to, subject, html }) {
  const client = getClient();
  if (!client) {
    console.warn(`[Mailer] Skipped email to ${to} — no Resend client`);
    return false;
  }

  const fromAddress = process.env.EMAIL_FROM || 'Redline SMP <noreply@redlinesmp.fun>';

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to,
      reply_to: process.env.REPLY_TO || 'tickets@redlinesmp.fun',
      subject,
      html,
    });

    if (error) {
      console.error(`[Mailer] ❌ Failed to send to ${to}:`, error.message);
      return false;
    }

    console.log(`[Mailer] ✅ Sent to ${to} | subject="${subject}" | id=${data?.id}`);
    return true;
  } catch (err) {
    console.error(`[Mailer] ❌ Failed to send to ${to}:`, err.message);
    return false;
  }
}

// ─── HTML email wrapper ───────────────────────────────────
function wrap(body) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;background:#050505;">
    
    <!-- Top Accent Bar -->
    <div style="height:4px;background:linear-gradient(90deg,#dc2626,#ef4444,#dc2626);"></div>
    
    <!-- Header -->
    <div style="background:#0a0a0a;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(239,68,68,0.15);">
      <div style="font-size:10px;letter-spacing:6px;color:#ef4444;font-weight:700;margin-bottom:4px;">⚔️ REDLINE SMP ⚔️</div>
      <div style="font-size:10px;letter-spacing:3px;color:#444;font-weight:400;">SUPPORT SYSTEM</div>
    </div>
    
    <!-- Body -->
    <div style="background:#0d0d0d;padding:32px;border-left:1px solid rgba(239,68,68,0.08);border-right:1px solid rgba(239,68,68,0.08);">
      ${body}
    </div>
    
    <!-- Server Info Bar -->
    <div style="background:#0a0a0a;padding:16px 32px;text-align:center;border-top:1px solid rgba(239,68,68,0.1);">
      <div style="display:inline-block;background:#111;border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:8px 20px;">
        <span style="font-size:10px;color:#666;letter-spacing:1px;">SERVER IP</span><br/>
        <span style="font-size:14px;color:#ef4444;font-family:'Courier New',monospace;font-weight:700;letter-spacing:1px;">mc.redlinesmp.fun</span>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background:#080808;padding:20px 32px;text-align:center;border-top:1px solid #1a1a1a;">
      <div style="margin-bottom:12px;">
        <a href="https://redlinesmp.fun" style="color:#888;text-decoration:none;font-size:11px;margin:0 8px;">Website</a>
        <span style="color:#333;">&middot;</span>
        <a href="https://store.redlinesmp.fun" style="color:#888;text-decoration:none;font-size:11px;margin:0 8px;">Store</a>
        <span style="color:#333;">&middot;</span>
        <a href="https://discord.gg/wBNMMj2PE4" style="color:#ef4444;text-decoration:none;font-size:11px;margin:0 8px;">Discord</a>
      </div>
      <div style="font-size:10px;color:#333;">© ${new Date().getFullYear()} Redline SMP. All rights reserved.</div>
    </div>
    
    <!-- Bottom Accent Bar -->
    <div style="height:4px;background:linear-gradient(90deg,#dc2626,#ef4444,#dc2626);"></div>
  </div>
</body>
</html>`;
}

// ─── Shared UI components ─────────────────────────────────
function statusBadge(text, color) {
  const colors = {
    green: 'background:#052e16;color:#22c55e;border-color:rgba(34,197,94,0.3)',
    red: 'background:#1c0a0a;color:#ef4444;border-color:rgba(239,68,68,0.3)',
    yellow: 'background:#1c1a0a;color:#eab308;border-color:rgba(234,179,8,0.3)',
  };
  return `<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:2px;border:1px solid;${colors[color] || colors.yellow}">${text}</span>`;
}

function infoRow(label, value, isLast = false) {
  const border = isLast ? '' : 'border-bottom:1px solid #1a1a1a;';
  return `<tr>
    <td style="padding:10px 14px;color:#555;font-size:12px;${border}width:110px;">${label}</td>
    <td style="padding:10px 14px;color:#e5e5e5;font-size:12px;${border}">${value}</td>
  </tr>`;
}

function infoTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;overflow:hidden;margin:20px 0;">${rows}</table>`;
}

function ctaButton(text, url, color = '#ef4444') {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;border-radius:6px;">${text}</a>
  </div>`;
}

// ─── Pre-built ticket email templates ─────────────────────

export function ticketCreatedUserHTML({ ticketId, username, category, messagePreview, timestamp }) {
  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">🎫</div>
      <h2 style="color:#ef4444;margin:0 0 8px;font-size:20px;font-weight:700;">Ticket Received</h2>
      ${statusBadge('OPEN', 'yellow')}
    </div>

    <p style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 20px;">
      Hey <strong style="color:#fff;">${username || 'there'}</strong>,<br/>
      We've received your support ticket. Our team will review it and get back to you as soon as possible.
    </p>

    ${infoTable(
      infoRow('Ticket ID', `<span style="font-family:'Courier New',monospace;color:#ef4444;">${ticketId}</span>`) +
      infoRow('Player', `${username || '—'}`) +
      infoRow('Category', `<strong>${category}</strong>`) +
      infoRow('Submitted', timestamp, true)
    )}

    <div style="background:#0a0a0a;border-left:3px solid #ef4444;padding:12px 16px;margin:20px 0;border-radius:0 6px 6px 0;">
      <div style="font-size:10px;color:#555;letter-spacing:1px;margin-bottom:6px;">YOUR MESSAGE</div>
      <p style="color:#999;font-size:13px;margin:0;font-style:italic;">"${messagePreview}"</p>
    </div>

    <p style="color:#666;font-size:12px;line-height:1.7;margin:20px 0 0;">
      You'll receive an email when the status of your ticket changes. Need faster help? Join our Discord.
    </p>

    ${ctaButton('JOIN DISCORD', 'https://discord.gg/wBNMMj2PE4')}
  `);
}

export function ticketCreatedAdminHTML({ ticketId, email, username, category, message, timestamp }) {
  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">🔔</div>
      <h2 style="color:#ef4444;margin:0 0 8px;font-size:20px;font-weight:700;">New Support Ticket</h2>
      ${statusBadge('REQUIRES ACTION', 'red')}
    </div>

    ${infoTable(
      infoRow('Ticket ID', `<span style="font-family:'Courier New',monospace;color:#ef4444;">${ticketId}</span>`) +
      infoRow('Email', `<a href="mailto:${email}" style="color:#ef4444;text-decoration:none;">${email}</a>`) +
      infoRow('Player', `${username || '—'}`) +
      infoRow('Category', `<strong>${category}</strong>`) +
      infoRow('Submitted', timestamp, true)
    )}

    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin:20px 0;">
      <div style="font-size:10px;color:#555;letter-spacing:1px;margin-bottom:10px;">FULL MESSAGE</div>
      <p style="color:#ccc;font-size:13px;margin:0;white-space:pre-wrap;line-height:1.7;">${message}</p>
    </div>

    ${ctaButton('OPEN ADMIN PANEL', 'https://store.redlinesmp.fun/admin/tickets')}
  `);
}

export function ticketResolvedHTML({ ticketId, username }) {
  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">✅</div>
      <h2 style="color:#22c55e;margin:0 0 8px;font-size:20px;font-weight:700;">Ticket Resolved</h2>
      ${statusBadge('RESOLVED', 'green')}
    </div>

    <p style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 20px;">
      Hey <strong style="color:#fff;">${username || 'there'}</strong>,<br/>
      Great news! Your support ticket has been reviewed and <strong style="color:#22c55e;">resolved</strong> by our team.
    </p>

    ${infoTable(
      infoRow('Ticket ID', `<span style="font-family:'Courier New',monospace;color:#22c55e;">${ticketId}</span>`, true)
    )}

    <p style="color:#666;font-size:12px;line-height:1.7;margin:20px 0 0;">
      If you have any further issues, feel free to open a new ticket or reach out on Discord. We're always here to help!
    </p>

    ${ctaButton('OPEN NEW TICKET', 'https://redlinesmp.fun/help')}
  `);
}

export function ticketDeclinedHTML({ ticketId, username }) {
  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">📋</div>
      <h2 style="color:#ef4444;margin:0 0 8px;font-size:20px;font-weight:700;">Ticket Update</h2>
      ${statusBadge('DECLINED', 'red')}
    </div>

    <p style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 20px;">
      Hey <strong style="color:#fff;">${username || 'there'}</strong>,<br/>
      After reviewing your support ticket, our team was unable to take action on this request at this time.
    </p>

    ${infoTable(
      infoRow('Ticket ID', `<span style="font-family:'Courier New',monospace;color:#ef4444;">${ticketId}</span>`, true)
    )}

    <p style="color:#666;font-size:12px;line-height:1.7;margin:20px 0 0;">
      If you believe this was in error or need further assistance, please open a new ticket with more details or contact us on Discord.
    </p>

    ${ctaButton('JOIN DISCORD', 'https://discord.gg/wBNMMj2PE4')}
  `);
}
