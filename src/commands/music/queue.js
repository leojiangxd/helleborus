const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current song queue'),
  async execute(interaction) {
    const queue = queueManager.getQueue();

    // Handle empty queue
    if (!queue || queue.length < 1) {
      return await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xD97221).setTitle('Queue Empty')]
      });
    }

    // Set pagination variables
    const songsPerPage = 10;
    const pageCount = Math.ceil((queue.length - 1) / songsPerPage);
    let currentPage = 0;

    // Function to generate embed for a specific page
    // Modify the generateEmbed function like this:
    const generateEmbed = (page) => {
      const startIndex = page * songsPerPage + 1; // +1 to skip now playing
      const endIndex = Math.min(startIndex + songsPerPage, queue.length);
      const pageItems = queue.slice(startIndex, endIndex);

      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle(queue.length - 1 > 0 ? `Queue (${queue.length - 1} Songs)` : 'Queue')
        .setFooter({ text: `Page ${page + 1}/${pageCount > 0 ? pageCount : 1}` });

      // Add fields individually with proper objects
      embed.addFields(
        { name: 'Volume', value: `${queueManager.getVolume()}`, inline: true },
        { name: 'Loop', value: `${queueManager.getLoop()}`, inline: true },
        { name: 'Now Playing', value: `[${queue[0].title}](<${queue[0].url}>) (${queue[0].duration.timestamp})` }
      );

      if (pageItems.length > 0) {
        let upNextText = pageItems.map((song, i) =>
          `${startIndex + i}. ${song.title} (${song.duration.timestamp})`
        ).join('\n');

        if (!upNextText) upNextText = "No songs in queue";

        // Add up next field separately
        embed.addFields({ name: 'Up Next', value: upNextText });
      }

      return embed;
    };

    // Create navigation buttons
    const createButtons = (page) => {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('◀◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === pageCount - 1 || pageCount <= 1),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('▶▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === pageCount - 1 || pageCount <= 1)
      );
      return row;
    };

    // Send initial message with first page
    const message = await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: pageCount > 1 ? [createButtons(currentPage)] : []
    }).then(response => response);

    // Only create collector if there are multiple pages
    if (pageCount > 1) {
      // Create button collector
      const collector = message.createMessageComponentCollector({
        time: 60000 // Collector active for 1 minute
      });

      collector.on('collect', async i => {
        // Ensure only the user who triggered the command can use the buttons
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: 'Only the person who used this command can navigate the queue',
            ephemeral: true
          });
        }

        // Handle button interactions
        switch (i.customId) {
          case 'first':
            currentPage = 0;
            break;
          case 'previous':
            currentPage = Math.max(0, currentPage - 1);
            break;
          case 'next':
            currentPage = Math.min(pageCount - 1, currentPage + 1);
            break;
          case 'last':
            currentPage = pageCount - 1;
            break;
        }

        // Update message with new page
        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [createButtons(currentPage)]
        });
      });

      collector.on('end', async () => {
        // Remove buttons when collector expires
        try {
          await message.edit({
            components: []
          });
        } catch (error) {
          console.error('Failed to remove buttons:', error);
        }
      });
    }
  },
};