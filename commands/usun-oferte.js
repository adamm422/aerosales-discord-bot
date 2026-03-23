/**
 * Komenda /usun-oferte - Usuwa ofertę po ID
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Lazy load github utils to avoid blocking
let deleteOffer;
function getDeleteOffer() {
  if (!deleteOffer) {
    deleteOffer = require('../utils/github').deleteOffer;
  }
  return deleteOffer;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usun-oferte')
    .setDescription('Usuwa ofertę lotniczą')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID oferty (np. londyn1, paryz2, rzym1)')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Użyj deferReply - daje nam 15 minut na odpowiedź
    try {
      await interaction.deferReply({ flags: 64 }); // Ephemeral
    } catch (e) {
      console.log('[USUN-OFERTE] Nie można deferować:', e.message);
      return;
    }

    try {
      const offerId = interaction.options.getString('id');
      console.log('[USUN-OFERTE] Próba usunięcia oferty:', offerId);
      
      const result = await getDeleteOffer()(offerId);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Błąd')
          .setDescription(result.error);

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Obsługa zarówno starej jak i nowej struktury oferty
      const from = result.deletedOffer.skad || result.deletedOffer.kodWylotu || '???';
      const to = result.deletedOffer.dokad || result.deletedOffer.miasto || '???';
      const price = result.deletedOffer.cena || 'Brak ceny';

      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🗑️ Oferta została usunięta')
        .setDescription(`**${from}** → **${to}**`)
        .addFields(
          { name: 'ID', value: result.deletedOffer.id || '???', inline: true },
          { name: 'Cena', value: price, inline: true }
        )
        .setFooter({
          text: `Usunięto przez ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error deleting offer:', error);
      try {
        await interaction.editReply({
          content: '❌ Wystąpił błąd podczas usuwania oferty. Spróbuj ponownie później.',
        });
      } catch (e) {
        console.log('[USUN-OFERTE] Nie można wysłać odpowiedzi o błędzie');
      }
    }
  },
};
