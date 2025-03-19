const { AudioPlayerStatus, createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const { EmbedBuilder } = require('discord.js');

const queue = [];
let volume = 0.333;
let loop = 'Off';
let player;
let isPlaying = false;
let resource;

// Function to play the next song
async function playNextSong(connection, interaction) {
  if (queue.length === 0) {
    console.log('>>> The queue is empty!');
    isPlaying = false;
    return;
  }

  if (!player) {
    player = createAudioPlayer();
    player.on(AudioPlayerStatus.Playing, async () => {
      if (interaction) {
        const currentSong = queue[0];
        const embed = new EmbedBuilder()
          .setColor(0xD97221)
          .setTitle('Now Playing')
          .setDescription(`[${currentSong.title}](<${currentSong.url}>)`)
          .setThumbnail(currentSong.thumbnail)
          .addFields(
            { name: 'Channel', value: `${currentSong.author}`, inline: true },
            { name: 'Duration', value: `${currentSong.duration.timestamp}`, inline: true },
          )
          .setFooter({
            text: `Requested by ${currentSong.requestedBy.username}`,
            iconURL: currentSong.requestedBy.avatar
          });

        console.log(`>>> Now playing ${currentSong.title} by ${currentSong.author}`)
        await interaction.channel.send({ embeds: [embed] });
      }
      isPlaying = true;
    });

    player.on(AudioPlayerStatus.Paused, () => {
      console.log(">>> Player is paused.");
      isPlaying = false;
    });

    player.on(AudioPlayerStatus.Idle, () => {
      if (loop == 'Queue') {
        queue.push(queue[0]);
      }
      if (loop != 'Song') {
        console.log('removing')
        queue.shift();
      }
      playNextSong(connection, interaction);
    });

    player.on('error', (error) => {
      console.error('Player error:', error);
      console.log('removing')
      queue.shift();
      playNextSong(connection, interaction);
    });

    // Subscribe the connection to the player
    if (connection) {
      connection.subscribe(player);
    }
  }

  if (queue.length > 0) {
    const song = queue[0];
    try {
      const stream = ytdl(song.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        liveBuffer: 20000,
        dlChunkSize: 0,
      });

      resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      resource.volume.setVolume(volume);
      player.play(resource);
    } catch (error) {
      console.log('removing')
      console.error('Error playing song:', error);
      queue.shift();
      playNextSong(connection, interaction);
    }
  }
}

function addToQueue(song, connection, interaction) {
  queue.push(song);
  console.log(`>>> Added to queue: ${song.title}`);

  // If not currently playing, start playback
  if (!isPlaying && connection) {
    playNextSong(connection, interaction);
  }

  return queue.length - 1;
}

// Function to stop and reset the player
function stopPlayer() {
  console.log('>>> Stopping player and clearing queue');
  if (player) {
    try {
      queue.splice(0, queue.length);
      player.stop(true);
      player.removeAllListeners();
      player = null;
    } catch (error) {
      console.error('Error stopping player:', error);
    }
  }

  // Clear the queue
  queue.length = 0;
  isPlaying = false;
}

module.exports = {
  queue,
  addToQueue,
  playNextSong,
  stopPlayer,
  getLoop: () => loop,
  getVolume: () => volume,
  getPlayer: () => player,
  getQueue: () => queue,
  getIsPlaying: () => isPlaying,
  setVolume: (newVolume) => {
    volume = newVolume;
    if (resource) {
      resource.volume.setVolume(newVolume);
    }
  },
  setLoop: (mode) => { loop = mode; }
};
