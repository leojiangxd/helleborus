const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops playing and clears the queue'),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Not Connected')

      return await interaction.reply({ embeds: [embed] });
    }

    try {
      queueManager.stopPlayer();

      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Player Stopped and Queue Cleared')

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle('Error Stopping')
        .setDescription(`${error}`)

      return await interaction.reply({ embeds: [embed] });
    }
  },
};