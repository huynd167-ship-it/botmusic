import { Client, GatewayIntentBits } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} from '@discordjs/voice';
import play from 'play-dl';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`✅ Bot ready: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // ===== PLAY =====
    if (message.content.startsWith("!play")) {
        const args = message.content.split(" ");
        const url = args[1];

        if (!url) return message.reply("❌ Nhập link YouTube!");

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("❌ Vào voice trước!");

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 30000);

            const stream = await play.stream(url);

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const player = createAudioPlayer();
            player.play(resource);
            connection.subscribe(player);

            message.reply(`🎶 Đang phát: ${url}`);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

        } catch (err) {
            console.error(err);
            message.reply("❌ Lỗi phát nhạc!");
        }
    }

    // ===== STOP =====
    if (message.content === "!stop") {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply("⏹️ Đã dừng");
        }
    }
});

client.login(process.env.TOKEN);
