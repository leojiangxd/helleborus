const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const yts = require('yt-search');
const ytpl = require('ytpl');
const queueManager = require('../../queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(option =>
      option.setName('song')
        .setDescription('Search for a song or playlist on YouTube')
        .setRequired(true)),

  async execute(interaction) {
    // Get the voice connection if it's already established
    let connection = getVoiceConnection(interaction.guild.id);

    // If there's no connection, join the voice channel
    if (!connection) {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return await interaction.reply('You need to join a voice channel first!');
      }

      try {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
      } catch (error) {
        console.error(error);
        return await interaction.reply('There was an error trying to join the voice channel.');
      }
    }

    let searchInput = interaction.options.getString('song');

    await interaction.deferReply();

    try {
      // If it is a link
      if (searchInput.match(/^https?:\/\/((www|music|m)?\.)?(youtube\.com|youtu\.be)\/.+$/)) {
        const url = new URL(searchInput);
        const listId = url.searchParams.get('list');

        // If link is a playlist
        if (listId) {
          try {
            // Get all videos from the playlist using ytpl
            const playlistInfo = await ytpl(listId, { limit: Infinity });

            if (!playlistInfo.items || playlistInfo.items.length === 0) {
              return interaction.editReply('No videos found in the playlist.');
            }

            // Add all videos to the queue
            let addedCount = 0;
            for (const item of playlistInfo.items) {
              const songInfo = {
                title: item.title,
                url: item.url,
                author: item.author.name,
                duration: {
                  seconds: item.durationSec,
                  timestamp: formatDuration(item.durationSec)
                },
                thumbnail: item.thumbnails[0].url,
                requestedBy: {
                  username: interaction.user.username,
                  avatar: interaction.user.displayAvatarURL()
                }
              };

              queueManager.addToQueue(songInfo, connection, interaction);
              addedCount++;
            }

            const playlistEmbed = new EmbedBuilder()
              .setColor(0xD97221)
              .setTitle('Playlist Added')
              .setDescription(`[Added ${addedCount} songs to the queue from ${playlistInfo.title}](<${searchInput}>)`)
              .setThumbnail(playlistInfo.thumbnails[0].url)
              .addFields(
                { name: 'Channel', value: playlistInfo.author.name, inline: true },
                { name: 'Total Songs', value: `${addedCount}`, inline: true }
              )
              .setFooter({
                text: `Requested by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
              });

            return interaction.editReply({ embeds: [playlistEmbed] });
          } catch (error) {
            console.error('Error fetching playlist:', error);
            return interaction.editReply(`Error fetching playlist: ${error.message}`);
          }
        }
        // If link is a video
        else {
          let videoId = url.searchParams.get('v');

          // Handle youtu.be links
          if (!videoId && url.hostname === 'youtu.be') {
            videoId = url.pathname.substring(1);
          }

          if (!videoId) {
            return interaction.editReply('Invalid YouTube URL.');
          }

          const video = await yts({ videoId });

          console.log(video)
          const songInfo = {
            title: video.title,
            url: video.url,
            author: video.author.name,
            duration: video.duration.seconds > 0
              ? video.duration
              : { seconds: 'LIVE', timestamp: 'LIVE' },
            thumbnail: video.thumbnail || video.image,
            requestedBy: {
              username: interaction.user.username,
              avatar: interaction.user.displayAvatarURL()
            }
          };
          console.log(songInfo.duration)

          const queuePosition = queueManager.addToQueue(songInfo, connection, interaction);

          const songEmbed = new EmbedBuilder()
            .setColor(0xD97221)
            .setTitle('Added Song')
            .setDescription(`[${songInfo.title}](<${songInfo.url}>)`)
            .setThumbnail(songInfo.thumbnail)
            .addFields(
              { name: 'Channel', value: `${songInfo.author}`, inline: true },
              { name: 'Duration', value: `${songInfo.duration.timestamp}`, inline: true },
              { name: 'Queue Position', value: `#${queuePosition}`, inline: true },
            )
            .setFooter({
              text: `Requested by ${songInfo.requestedBy.username}`,
              iconURL: songInfo.requestedBy.avatar
            });

          return interaction.editReply({ embeds: [songEmbed] });
        }
        // If it is a search term
      }
      // else {
      //   const search = await yts(searchInput);
      //   const results = search.videos.slice(0, 5);

      //   if (!results || results.length === 0) {
      //     return interaction.editReply('No results found for your search.');
      //   }

      //   const song = results[0];

      //   const songInfo = {
      //     title: song.title,
      //     url: song.url,
      //     author: song.author.name,
      //     duration: song.duration.seconds > 0
      //       ? song.duration
      //       : { seconds: 'LIVE', timestamp: 'LIVE' },
      //     thumbnail: song.thumbnail || song.image,
      //     requestedBy: {
      //       username: interaction.user.username,
      //       avatar: interaction.user.displayAvatarURL()
      //     }
      //   };

      //   const queuePosition = queueManager.addToQueue(songInfo, connection, interaction);

      //   const songEmbed = new EmbedBuilder()
      //     .setColor(0xD97221)
      //     .setTitle('Added Song')
      //     .setDescription(`[${songInfo.title}](<${songInfo.url}>)`)
      //     .setThumbnail(songInfo.thumbnail)
      //     .addFields(
      //       { name: 'Channel', value: `${songInfo.author}`, inline: true },
      //       { name: 'Duration', value: `${songInfo.duration.timestamp}`, inline: true },
      //       { name: 'Queue Position', value: `#${queuePosition}`, inline: true },
      //     )
      //     .setFooter({
      //       text: `Requested by ${songInfo.requestedBy.username}`,
      //       iconURL: songInfo.requestedBy.avatar
      //     });

      //   return interaction.editReply({ embeds: [songEmbed] });
      // }
      else {
        const search = await yts(searchInput);
        const results = search.videos.slice(0, 5);

        if (!results || results.length === 0) {
          return interaction.editReply('No results found for your search.');
        }

        // Create buttons for each search result
        const buttons = results.map((video, index) =>
          new ButtonBuilder()
            .setCustomId(`select_song_${index}`)
            .setLabel(`${index + 1}`)
            .setStyle(ButtonStyle.Primary)
        );

        const row = new ActionRowBuilder().addComponents(buttons);

        const searchEmbed = new EmbedBuilder()
          .setColor(0xD97221)
          .setTitle('Search Results')
          .setDescription(results.map((video, index) => `${index + 1}. [${video.title}](<${video.url}>) (${video.duration.timestamp})`).join('\n'))

        // Send the search results with buttons
        const response = await interaction.editReply({ embeds: [searchEmbed], components: [row] });

        // Create a button interaction collector
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 30_000 // 30 seconds to make a selection
        });

        collector.on('collect', async (buttonInteraction) => {
          if (buttonInteraction.user.id !== interaction.user.id) {
            return buttonInteraction.reply({ content: 'You did not initiate this search.', ephemeral: true });
          }

          // Get the selected song index from the button's custom ID
          const selectedIndex = parseInt(buttonInteraction.customId.split('_')[2]);
          const selectedSong = results[selectedIndex];

          const songInfo = {
            title: selectedSong.title,
            url: selectedSong.url,
            author: selectedSong.author.name,
            duration: selectedSong.duration.seconds > 0 
              ? selectedSong.duration 
              : { seconds: 'LIVE', timestamp: 'LIVE' },
            thumbnail: selectedSong.thumbnail || selectedSong.image,
            requestedBy: {
              username: interaction.user.username,
              avatar: interaction.user.displayAvatarURL()
            }
          };

          const queuePosition = queueManager.addToQueue(songInfo, connection, interaction);

          const songEmbed = new EmbedBuilder()
          .setColor(0xD97221)
          .setTitle('Added Song')
          .setDescription(`[${songInfo.title}](<${songInfo.url}>)`)
          .setThumbnail(songInfo.thumbnail)
          .addFields(
            { name: 'Channel', value: `${songInfo.author}`, inline: true },
            { name: 'Duration', value: `${songInfo.duration.timestamp}`, inline: true },
            { name: 'Queue Position', value: `#${queuePosition}`, inline: true },
          )
          .setFooter({
            text: `Requested by ${songInfo.requestedBy.username}`,
            iconURL: songInfo.requestedBy.avatar
          });
    
        // Update the interaction with the selected song
        await buttonInteraction.update({ embeds: [songEmbed], components: [] });
        collector.stop();
        });
        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            interaction.editReply({ content: 'Song selection timed out.', components: [] });
          }
        });
      }
    } catch (error) {
      console.error('Error in play command:', error);
      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle(`Error Adding Song`)
        .setDescription(`${error.message || error}`)

      return await interaction.editReply({ embeds: [embed] });
    }
  },
};

// Helper function to format duration in seconds to MM:SS format
function formatDuration(seconds) {
  if (!seconds) return '00:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}