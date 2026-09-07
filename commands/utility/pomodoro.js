import { 
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

let time = 0;

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetTime - now;
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    let countdown = pad(hours) + " : " + pad(minutes) + " : " + pad(seconds);

    if (distance < 0) {
        clearInterval(timer);
        countdown = "Timer Complete";
    }
}

function pomodoroTimer(time) {
    const targetTime = new Date().getTime() + (time * 60 * 1000);
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    const embed = new EmbedBuilder()
        .setTitle(countdown)
        .setImage('./tomato_top_60s_loop.mp4')
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('start')
                .setLabel('Start')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('Stop')
                .setStyle(ButtonStyle.Danger)
        )
    channel.send({ embeds: [embed], components: [row] });

    let secondsLeft = 10;

    const interval = setInterval(async () => {
        secondsLeft--;
    const updated = new EmbedBuilder()
        .setTitle(countdown)

    await msg.edit({ embeds: [updated] }).catch(console.error);
    }
}

export default {
    data: new SlashCommandBuilder().setName('pomodoro').setDescription('Start a pomodoro timer!').addIntegerOption((option) => option.setName('minutes').setDescription('Length of timer in minutes').setRequired(true)),
    async execute(interaction) {
        let DurationMinutes = interaction.options.getUser('minutes');
        if (DurationMinutes <= 0) {
            await interaction.reply({
                content: 'Invalid time, time must be at least 1 minute!',
                flags: MessageFlags.Ephemeral,
            })
        } else {
            pomodoroTimer(DurationMinutes);
            await interaction.reply('Works!');
        }
    }
}