const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Leaves the current voice channel'),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);

    // Check if bot is connected to a voice channel
    if (!connection) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Not Connected')

      return await interaction.reply({ embeds: [embed] });
    }

    // Try to destroy the voice connection
    try {
      // Stop playing and clear the queue before disconnecting
      queueManager.stopPlayer();

      connection.destroy();

      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Disconnected From Voice Channel')

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);

      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Error While Disconnecting')
        .setDescription(`${error}`)

      return await interaction.reply({ embeds: [embed] });
    }
  },
};