import { DatabaseSync } from 'node:sqlite';
import { EmbedBuilder, SlashCommandBuilder, MessageFlags } from "discord.js";

async function streak_stats(userId, channel) {
    const db = new DatabaseSync('stats.db');
    const row = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    if (!row) {
        await channel.send({
            embeds: [new EmbedBuilder()
                .setColor('#FF6B00')
                .setTitle('Streak Stats')
                .setDescription('You have no streak yet. Complete a pomodoro to start one!')],
            flags: MessageFlags.Ephemeral
        });
        db.close()
        return;
    }
    const embed = new EmbedBuilder()
        .setTitle('Streak Stats')
        .setColor('#FF6B00')
        .setFields(
            { name: '🔥 Streak', value: String(row.current_streak), inline: false },
            { name: '🏆 Best', value: String(row.longest_streak), inline: false },
            { name: '📆 Last Time Active', value: String(row.last_active_date), inline: false }
        )
    await channel.send({ embeds: [embed]});
    db.close()
}

export default {
    data: new SlashCommandBuilder().setName('streak').setDescription('See all your streak stats!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const channel = interaction.channel;
        streak_stats(userId, channel);
    }
}