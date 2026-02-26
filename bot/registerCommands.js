/**
 * Register Guild Slash Commands
 * ──────────────────────────────
 * Run once after adding/updating commands:
 *   node registerCommands.js
 *
 * Registers commands for DISCORD_GUILD_ID only (NOT global).
 */
import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import { data as referralCommand } from './commands/referral.js';

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env');
  process.exit(1);
}

const commands = [referralCommand.toJSON()];
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`📡 Registering ${commands.length} guild command(s) for ${GUILD_ID}...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ Registered ${result.length} command(s) successfully.`);
    console.log('   Commands:', result.map((c) => `/${c.name}`).join(', '));
  } catch (err) {
    console.error('❌ Registration failed:', err);
    process.exit(1);
  }
})();
