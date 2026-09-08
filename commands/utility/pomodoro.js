import { 
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    AttachmentBuilder,
} from "discord.js";
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('stats.db');
const update_streak = db.prepare(`
    INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (?, 1, 1, ?)
    ON CONFLICT(user_id) DO UPDATE SET
        current_streak = current_streak + 1,
        longest_streak = MAX(longest_streak, current_streak + 1),
        last_active_date = excluded.last_active_date
`)

async function pomodoroTimer(minutes, channel, userId) {
    const targetTime = Date.now() + minutes * 60 * 1000;
    let timer;
    let msg;
    let paused = false;

    function updateCountdown() {
        if (paused) return;
        const distance = targetTime - Date.now();
        const pad = n => String(n).padStart(2, '0');
        let countdown;

        if (distance < 0) {
            countdown = "Timer Complete";
            update_streak.run(userId, Date.now());
            clearInterval(timer);
        } else {
            const h = Math.floor((distance % 86400000) / 3600000);
            const m = Math.floor((distance % 3600000) / 60000);
            const s = Math.floor((distance % 60000) / 1000);
            countdown = `${pad(h)} : ${pad(m)} : ${pad(s)}`;
        }

        msg.edit({
            embeds: [new EmbedBuilder()
                .setTitle(countdown)
                .setImage('attachment://tomato.gif')]    
        }).catch(console.error);
    }
    const file = new AttachmentBuilder('./tomato.gif', { name: 'tomato.gif' });

    const embed = new EmbedBuilder()
        .setTitle('Starting...')
        .setImage('attachment://tomato.gif');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pause').setLabel('Pause').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
    );

    msg = await channel.send({ embeds: [embed], files: [file], components: [row] });

    timer = setInterval(updateCountdown, 1000);
    updateCountdown();

    channel.client.once('interactionCreate', async i => {
        if (!i.isButton()) return;

        if (i.customId === 'stop') {
            clearInterval(timer);
            await i.reply({ content: 'Timer stopped.', flags: MessageFlags.Ephemeral });
        } else if (i.customId === 'pause') {
            if (!paused) {
                paused = true;
                pauseStart = Date.now();
            } else {
                paused = false;
                targetTime += Date.now() - pauseStart;
            }
            await i.reply({
                content: paused ? '⏸ Paused' : '▶ Resumed',
                flags: MessageFlags.Ephemeral,
            });
        }
    });
}

export default {
    data: new SlashCommandBuilder().setName('pomodoro').setDescription('Start a pomodoro timer!').addIntegerOption((option) => option.setName('minutes').setDescription('Length of timer in minutes').setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const minutes = interaction.options.getInteger('minutes');
        if (minutes <= 0) {
            return interaction.reply({
                content: 'Invalid time, must be at least 1 minute!',
                flags: MessageFlags.Ephemeral,
            });
        }

        await pomodoroTimer(minutes, interaction.channel, userId);
        await interaction.reply('Timer started!');
    }
}