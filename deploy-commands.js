import dotenv from 'dotenv';
dotenv.config();

import { REST, Routes, Collection } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const commandModule = await import(fileUrl);
        const command = commandModule.default;

        if ('data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const clientID = process.env.DISCORD_CLIENT_ID;

const ffmpeg = new FFmpeg();
await ffmpeg.load()

(async () => {
    try {
        console.log(`Started refreshing ${commands.size} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientID),
            { body: commands.map(c => c.data.toJSON()) }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();