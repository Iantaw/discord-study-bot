import dotenv from 'dotenv'
dotenv.config()

import {
    Client,
    GatewayIntentBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ],
});

client.login(process.env.DISCORD_TOKEN);

const btn = new ButtonBuilder()
        .setCustomId('btn')
        .setLabel('Click for Test')
        .setStyle(ButtonStyle.Primary);
const row = new ActionRowBuilder().addComponents(btn);

client.on("messageCreate",  async (message) => {
    console.log(message);

    if (!message?.author.bot) {
        message.author.send({
            content: 'Button test',
            components: [row]
        })
        message.channel.send({
            content: 'Button test',
            components: [row]
        })
    }

});

client.on('interactionCreate', async interaction => {
    if (interaction.customId === 'btn') {
        await interaction.reply({
            content: 'Test',
            ephemeral: true
        })
    }
})