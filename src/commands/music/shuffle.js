const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue'),
  async execute(interaction) {
    let queue = queueManager.getQueue();

    if (queue.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle(`Nothing to Shuffle`)

      return await interaction.reply({ embeds: [embed] });
    }

    for (let i = queue.length - 1; i >= 1; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    const embed = new EmbedBuilder()
      .setColor(0xD97221)
      .setTitle(`Shuffled Queue`)

    return await interaction.reply({ embeds: [embed] });
  },
};