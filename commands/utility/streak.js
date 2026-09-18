import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('stats.db');

export default {
    data: new SlashCommandBuilder()
        .setName('streak')
        .setDescription('View your Pomodoro streak'),

    async execute(interaction) {
        const row = db.prepare(`
            SELECT current_streak, longest_streak, last_active_date
            FROM streaks
            WHERE user_id = ?
        `).get(interaction.user.id);

        if (!row) {
            return interaction.reply('You don\'t have a Pomodoro streak yet!');
        }

        const lastActive = new Date(row.last_active_date);

        const formattedDate = lastActive.toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Pomodoro Streak`)
            .addFields(
                {
                    name: '🔥 Current Streak',
                    value: `${row.current_streak} day${row.current_streak === 1 ? '' : 's'}`,
                    inline: true,
                },
                {
                    name: '🏆 Longest Streak',
                    value: `${row.longest_streak} day${row.longest_streak === 1 ? '' : 's'}`,
                    inline: true,
                },
                {
                    name: '📅 Last Active',
                    value: formattedDate,
                    inline: false,
                },
            );

        await interaction.reply({ embeds: [embed] });
    },
};
