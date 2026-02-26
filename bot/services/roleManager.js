/**
 * Role Manager Service
 * ─────────────────────
 * Manages Creator role assignment in the guild.
 * Used by bot index.js on ready, and available for external triggers.
 */

let clientRef = null;

/**
 * Store the Discord.js client reference.
 * Called once from index.js after the bot is ready.
 */
export function setClient(client) {
  clientRef = client;
}

/**
 * Assign the Creator role to a Discord user.
 * Non-throwing — failures are logged but never break the caller.
 *
 * @param {string} discordId
 * @returns {Promise<boolean>} true if role assigned or already present.
 */
export async function assignCreatorRole(discordId) {
  try {
    if (!clientRef) {
      console.warn('[RoleManager] Bot client not ready — skipping.');
      return false;
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = process.env.DISCORD_CREATOR_ROLE_ID;

    if (!guildId || !roleId) {
      console.warn('[RoleManager] DISCORD_GUILD_ID or DISCORD_CREATOR_ROLE_ID missing.');
      return false;
    }

    const guild = await clientRef.guilds.fetch(guildId);
    if (!guild) {
      console.warn(`[RoleManager] Guild ${guildId} not found.`);
      return false;
    }

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) {
      console.warn(`[RoleManager] Member ${discordId} not found in guild.`);
      return false;
    }

    if (member.roles.cache.has(roleId)) {
      console.log(`[RoleManager] ${member.user.tag} already has Creator role — skipped.`);
      return true;
    }

    await member.roles.add(roleId);
    console.log(`[RoleManager] ✅ Creator role assigned to ${member.user.tag} (${discordId})`);
    return true;
  } catch (err) {
    console.error(`[RoleManager] Failed for ${discordId}:`, err.message);
    return false;
  }
}
