const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins the user\'s voice channel'),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return await interaction.reply('You need to join a voice channel first!');
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle(`Joined <#${voiceChannel.id}>`)

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);

      const embed = new EmbedBuilder()
        .setColor(0xD97221)
        .setTitle(`Error Joining Voice Channel`)
        .setDescription(`${error}`)

      return await interaction.reply({ embeds: [embed] });
    }
  },
};
