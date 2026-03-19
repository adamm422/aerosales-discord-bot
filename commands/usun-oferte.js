/**
 * Komenda /usun-oferte - Usuwa ofertę po ID
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { deleteOffer } = require('../utils/github');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usun-oferte')
    .setDescription('Usuwa ofertę lotniczą')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID oferty do usunięcia')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const offerId = interaction.options.getString('id');
      
      const result = await deleteOffer(offerId);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Błąd')
          .setDescription(result.error);

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🗑️ Oferta została usunięta')
        .setDescription(`**${result.deletedOffer.miasto}** (${result.deletedOffer.kraj})`)
        .addFields(
          { name: 'ID', value: result.deletedOffer.id, inline: true },
          { name: 'Cena', value: result.deletedOffer.cena, inline: true }
        )
        .setFooter({ 
          text: `Usunięto przez ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error deleting offer:', error);
      await interaction.editReply({
        content: '❌ Wystąpił błąd podczas usuwania oferty. Spróbuj ponownie później.',
      });
    }
  },
};