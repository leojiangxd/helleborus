const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Changes the player\'s volume')
    .addStringOption(option =>
      option.setName('volume')
        .setDescription('Volume level')
        .setRequired(true)),
  async execute(interaction) {
    let volume = parseFloat(interaction.options.getString('volume'));
    if (isNaN(volume)) {
      volume = 0;
    }
		queueManager.setVolume(volume);
    const embed = new EmbedBuilder()
      .setColor(0xD97221)
      .setTitle(`Volume: ${volume}`)

    return await interaction.reply({ embeds: [embed] });
  },
};