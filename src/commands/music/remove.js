const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue')
    .addStringOption(option =>
      option.setName('index')
        .setDescription('Index of the song to be removed')
        .setRequired(true)),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection || queueManager.queue.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Remove Failed: Queue Empty')
      return await interaction.reply({ embeds: [embed] });
    }

    const index = parseInt(interaction.options.getString('index'), 10);
    let removedSong;

    if (isNaN(index) || index < 1 || index > queueManager.queue.length) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Remove Failed: Invalid Index')
      return await interaction.reply({ embeds: [embed] });
    } else {
      removedSong = queueManager.queue.splice(index, 1)[0];
      console.log(removedSong)
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Removed')
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