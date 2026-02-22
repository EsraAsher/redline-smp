/**
 * RCON Service — delivers purchased items to the Minecraft server.
 *
 * Each product can have a `commands` array on its order item.
 * Placeholders:
 *   {player}   → the buyer's Minecraft username
 *   {qty}      → the quantity purchased
 *
 * If RCON is not configured (no host/password in env), delivery is
 * silently skipped so the store still works in test mode.
 */
import { Rcon } from 'rcon-client';

const RCON_HOST = process.env.RCON_HOST || '';
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575', 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';

/**
 * Returns true if RCON is configured (host + password exist).
 */
export function isRconConfigured() {
  return !!(RCON_HOST && RCON_PASSWORD);
}

/**
 * Run a list of commands for a paid order.
 *
 * @param {string}   mcUsername  — player's Minecraft name
 * @param {Object[]} items      — order items (each has title, quantity, commands[])
 * @returns {{ success: boolean, log: string[] }}
 */
export async function deliverOrder(mcUsername, items) {
  const log = [];

  if (!isRconConfigured()) {
    log.push('[RCON] Not configured — skipping delivery (test mode)');
    return { success: true, log };
  }

  let rcon;
  try {
    rcon = await Rcon.connect({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
      timeout: 10000,
    });
    log.push(`[RCON] Connected to ${RCON_HOST}:${RCON_PORT}`);

    for (const item of items) {
      const commands = item.commands || [];
      if (commands.length === 0) {
        // Fallback: broadcast a message so the player knows
        const fallback = `say ${mcUsername} purchased ${item.quantity}x ${item.title}!`;
        const res = await rcon.send(fallback);
        log.push(`[RCON] Fallback → ${fallback} | Response: ${res}`);
        continue;
      }

      for (let cmd of commands) {
        cmd = cmd
          .replace(/\{player\}/gi, mcUsername)
          .replace(/\{qty\}/gi, String(item.quantity));

        const res = await rcon.send(cmd);
        log.push(`[RCON] ${cmd} → ${res}`);
      }
    }

    log.push('[RCON] All commands sent successfully');
    return { success: true, log };
  } catch (err) {
    log.push(`[RCON] ERROR: ${err.message}`);
    return { success: false, log };
  } finally {
    try { rcon?.end(); } catch { /* ignore */ }
  }
}
