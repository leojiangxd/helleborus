const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Change the loop state')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Loop State')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'Off' },
          { name: 'Song', value: 'Song' },
          { name: 'Queue', value: 'Queue' },
        )),
  async execute(interaction) {
    const mode = interaction.options.getString('mode');
    queueManager.setLoop(mode);
    const embed = new EmbedBuilder()
    .setColor(0xD97221)
    .setTitle(`Loop: ${mode}`)

    return await interaction.reply({ embeds: [embed] });
  },
};
