const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip one or more songs in the queue')
    .addStringOption(option =>
      option.setName('index')
        .setDescription('Skip to a specific song')
        .setRequired(false)),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);
    const queue = queueManager.getQueue();

    if (!connection || queue.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Nothing to Skip')

      return await interaction.reply({ embeds: [embed] });
    }

    let index = interaction.options.getString('index');
    if (index) {
      index = parseInt(index);
    } else {
      index = 1;
    }

    // Store the current song before skipping (for the skipped message)
    const removedSong = queue[0];

    // Skip songs based on index
    for (let i = 0; i < index; i++) {
      const currentSong = queue[0];
      if (queueManager.getLoop() === 'Queue') {
        queue.push(currentSong);
      }
      if (queueManager.getLoop() !== 'Song') {
        queue.shift();
      }
      if (queue.length === 0) {
        break;
      }
    }

    // Pause current playback and start next song
    queueManager.getPlayer().pause();
    queueManager.playNextSong(connection, interaction);

    // If we skipped multiple songs
    if (index > 1) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle(`Skipped ${index} Songs`)

      return await interaction.reply({ embeds: [embed] });
    }
    // If we just skipped one song
    else {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Skipped')
        .setDescription(`[${removedSong.title}](${removedSong.url})`)
        .setThumbnail(removedSong.thumbnail)
        .addFields(
          { name: 'Channel', value: `${removedSong.author}`, inline: true },
          { name: 'Duration', value: `${removedSong.duration.timestamp}`, inline: true },
        )
        .setFooter({
          text: `Requested by ${removedSong.requestedBy.username}`,
          iconURL: removedSong.requestedBy.avatar
        });

      return await interaction.reply({ embeds: [embed] });
    }
  },
};