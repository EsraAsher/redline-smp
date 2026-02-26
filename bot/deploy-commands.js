/**
 * Register guild-specific slash commands.
 * Run once: node deploy-commands.js
 */
import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import { data as referralCommand } from './commands/referral.js';

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !GUILD_ID || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env');
  process.exit(1);
}

const commands = [referralCommand.toJSON()];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`📡 Registering ${commands.length} guild command(s)...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ Successfully registered ${result.length} command(s) for guild ${GUILD_ID}`);
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
    process.exit(1);
  }
})();
