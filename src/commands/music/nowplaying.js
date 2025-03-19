const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the current song'),
  async execute(interaction) {
    if (!queueManager.queue || queueManager.queue.length === 0) {
			const embed = new EmbedBuilder()
      .setColor(0xD97221)
      .setTitle('Now Playing')
      .setDescription(`No song is currently playing`)

      return await interaction.reply({ embeds: [embed] });
    }
    
    const currentSong = queueManager.queue[0];
    
    const embed = new EmbedBuilder()
      .setColor(0xD97221)
      .setTitle('Now Playing')
      .setDescription(`[${currentSong.title}](<${currentSong.url}>)`)
      .setThumbnail(currentSong.thumbnail)
      .addFields(
        { name: 'Channel', value: `${currentSong.author}`, inline: true },
        { name: 'Duration', value: `${currentSong.duration.timestamp}`, inline: true },
        // { name: 'Time Remaining', value: `TODO`, inline: true },
      )
			.setFooter({
				text: `Requested by ${currentSong.requestedBy.username}`,
				iconURL: currentSong.requestedBy.avatar
			});
    
    return await interaction.reply({ embeds: [embed] });
  },
};