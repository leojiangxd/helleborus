const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or unpause the player'),
  async execute(interaction) {
    const player = queueManager.getPlayer();
    if (!player) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('No Active Player')
      
      return await interaction.reply({ embeds: [embed] });
    }
    
    if (queueManager.getIsPlaying()) {
      player.pause();
      
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Playback Paused')
      
      return await interaction.reply({ embeds: [embed] });
    }
    else {
      player.unpause();
      
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Playback Resumed')
      
      return await interaction.reply({ embeds: [embed] });
    }
  },
};