import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { fetchReferralStats } from '../utils/api.js';

// ─── Command definition ──────────────────────────────────
export const data = new SlashCommandBuilder()
  .setName('referral')
  .setDescription('Referral program commands')
  .addSubcommand((sub) =>
    sub.setName('stats').setDescription('View your referral stats & earnings')
  );

// ─── Command handler ─────────────────────────────────────
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'stats') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const stats = await fetchReferralStats(interaction.user.id);

      if (!stats) {
        return interaction.editReply({
          content: '❌ You are not an approved Creator Partner.',
        });
      }

      const eligible = stats.pendingCommission >= stats.payoutThreshold;

      const statusEmoji = {
        active: '🟢',
        paused: '🟡',
        banned: '🔴',
      };

      const embed = new EmbedBuilder()
        .setTitle(`📊 Referral Stats — ${stats.creatorName}`)
        .setColor(0xff3333)
        .addFields(
          { name: 'Referral Code', value: `\`${stats.referralCode}\``, inline: true },
          { name: 'Status', value: `${statusEmoji[stats.status] || '⚪'} ${stats.status.toUpperCase()}`, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: 'Total Uses', value: `${stats.totalUses}`, inline: true },
          { name: 'Revenue Generated', value: `₹${stats.totalRevenueGenerated.toLocaleString('en-IN')}`, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: 'Pending Commission', value: `₹${stats.pendingCommission.toLocaleString('en-IN')}`, inline: true },
          { name: 'Payout Eligible', value: eligible ? '✅ Yes' : `❌ Need ₹${(stats.payoutThreshold - stats.pendingCommission).toLocaleString('en-IN')} more`, inline: true },
        )
        .setFooter({ text: 'Redline SMP • Creator Program' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Bot] /referral stats error:', err.message);
      return interaction.editReply({
        content: '⚠️ Something went wrong fetching your stats. Please try again later.',
      });
    }
  }
}
