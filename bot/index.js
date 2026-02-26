/**
 * Redline SMP Discord Bot
 * ─────────────────────────
 * Standalone worker process — does NOT run inside the main API server.
 * Uses backend REST API for all data access.
 */
import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { data as referralData, execute as referralExecute } from './commands/referral.js';
import { setClient } from './services/roles.js';

dotenv.config();

// ─── Validation ───────────────────────────────────────────
const requiredEnv = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_GUILD_ID',
  'DISCORD_CREATOR_ROLE_ID',
  'BACKEND_BASE_URL',
  'BOT_INTERNAL_SECRET',
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`);
    process.exit(1);
  }
}

// ─── Client setup ─────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── Command registry ─────────────────────────────────────
client.commands = new Collection();
client.commands.set(referralData.name, { data: referralData, execute: referralExecute });

// ─── Ready event ──────────────────────────────────────────
client.once('ready', () => {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`  🤖 Redline SMP Bot online`);
  console.log(`  👤 Logged in as: ${client.user.tag}`);
  console.log(`  🏠 Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log('═══════════════════════════════════════');
  console.log('');

  // Store client reference for role assignment service
  setClient(client);
});

// ─── Interaction handler ──────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Bot] Command error (${interaction.commandName}):`, err);
    const reply = { content: '⚠️ An error occurred running this command.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

// ─── Login ────────────────────────────────────────────────
client.login(process.env.DISCORD_BOT_TOKEN);
