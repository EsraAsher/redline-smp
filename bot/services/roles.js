/**
 * Auto role assignment service.
 * Assigns DISCORD_CREATOR_ROLE_ID to approved creators in the guild.
 */

let clientRef = null;

/**
 * Store the Discord client reference so the backend approval hook can call us.
 * Called once from bot index.js after client is ready.
 */
export function setClient(client) {
  clientRef = client;
}

/**
 * Assign the Creator role to a Discord user by their ID.
 * Non-throwing — failures are logged but never break the caller.
 *
 * @param {string} discordId - The Discord user ID to assign the role to.
 * @returns {Promise<boolean>} true if role was assigned (or already present), false on failure.
 */
export async function assignCreatorRole(discordId) {
  try {
    if (!clientRef) {
      console.warn('[Roles] Bot client not ready — cannot assign role.');
      return false;
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = process.env.DISCORD_CREATOR_ROLE_ID;

    if (!guildId || !roleId) {
      console.warn('[Roles] DISCORD_GUILD_ID or DISCORD_CREATOR_ROLE_ID not set.');
      return false;
    }

    const guild = await clientRef.guilds.fetch(guildId);
    if (!guild) {
      console.warn(`[Roles] Guild ${guildId} not found.`);
      return false;
    }

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) {
      console.warn(`[Roles] Member ${discordId} not found in guild.`);
      return false;
    }

    if (member.roles.cache.has(roleId)) {
      console.log(`[Roles] ${member.user.tag} already has Creator role.`);
      return true;
    }

    await member.roles.add(roleId);
    console.log(`[Roles] ✅ Assigned Creator role to ${member.user.tag} (${discordId})`);
    return true;
  } catch (err) {
    console.error(`[Roles] Failed to assign role to ${discordId}:`, err.message);
    return false;
  }
}
