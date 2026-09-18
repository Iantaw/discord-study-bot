import { 
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    AttachmentBuilder,
    ActionRow,
} from "discord.js";
import { DatabaseSync } from 'node:sqlite';

async function pomodoroTimer(minutes, channel, userId) {
    let targetTime = Date.now() + minutes * 60 * 1000;
    let timer;
    let msg;
    let paused = false;
    let pauseStart = 0;
    const timerId = Math.random().toString(36).slice(2, 10);
    const pauseId = `pomodoro:${timerId}:pause`;
    const stopId = `pomodoro:${timerId}:stop`;

    function updateCountdown() {
        if (paused) return;
        const distance = Math.max(0, targetTime - Date.now());
        const pad = n => String(n).padStart(2, '0');
        let countdown;

        if (distance <= 0) {
            countdown = "Timer Complete";
            const db = new DatabaseSync('stats.db');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMs = today.getTime();

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayMs = yesterday.getTime()

            const update_streak = db.prepare(`
                INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date)
                VALUES (?, 1, 1, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    current_streak = CASE
                        WHEN last_active_date = ? THEN current_streak
                        WHEN last_active_date = ? THEN current_streak + 1
                        ELSE 1
                    END,
                    longest_streak = MAX(
                        longest_streak,
                        CASE
                            WHEN last_active_date = ? THEN current_streak
                            WHEN last_active_date = ? THEN current_streak + 1
                            ELSE 1
                        END
                    ),
                    last_active_date = ?
            `);
            update_streak.run(
                userId,
                todayMs,
                todayMs,
                yesterdayMs,
                todayMs,
                yesterdayMs,
                todayMs
            );
            
            db.close()
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

    function createRow(paused = false, disabled = false) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(pauseId)
                .setLabel(paused ? 'Resume' : 'Pause')
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId(stopId)
                .setLabel('Stop')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled),
        );
    }

    msg = await channel.send({ embeds: [embed], files: [file], components: [createRow()] });

    const collector = msg.createMessageComponentCollector({
        componentType:2,
        time: minutes * 60 * 1000 + 60000,
    });

    collector.on('collect', async i => {
        if (i.user.id !== userId) {
            return i.reply({
                content: 'Only the person who started this timer can control it.',
                flags: MessageFlags.Ephemeral,
            });
        }

        if (i.customId === stopId) {
            clearInterval(timer);
            collector.stop('stopped');

            await i.update({
                embeds: [
                    new EmbedBuilder()
                    .setTitle('Timer Stopped')
                    .setImage('attachment://tomato.gif')
                ],
                components: [],
            });

            return;

        }
        if (i.customId === pauseId) {
            if (!paused) {
                paused = true;
                pauseStart = Date.now();
                
                await i.update({
                    components: [createRow(true, false)],
                });
            } else {
                targetTime += Date.now() - pauseStart;
                paused = false;

                await i.update({
                    components: [createRow(false, false)],
                });

                updateCountdown()
            }
        }
    });

    timer = setInterval(updateCountdown, 1000);
    updateCountdown();
}

export default {
    data: new SlashCommandBuilder().setName('pomodoro').setDescription('Start a pomodoro timer!').addIntegerOption((option) => option.setName('minutes').setDescription('Length of timer in minutes').setRequired(true).setMinValue(1).setMaxValue(1440)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const minutes = interaction.options.getInteger('minutes');
        await interaction.reply('Timer started!');
        await pomodoroTimer(minutes, interaction.channel, userId);
    }
}