/**
 * Komenda /lista-ofert - Wyświetla listę wszystkich ofert
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllOffers } = require('../utils/github');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lista-ofert')
    .setDescription('Wyświetla listę wszystkich ofert lotniczych')
    .addIntegerOption(option =>
      option
        .setName('strona')
        .setDescription('Numer strony (domyślnie 1)')
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const offers = await getAllOffers();
      
      if (!offers || offers.length === 0) {
        await interaction.editReply({
          content: '📭 Brak dostępnych ofert.',
        });
        return;
      }

      const page = interaction.options.getInteger('strona') || 1;
      const itemsPerPage = 5;
      const totalPages = Math.ceil(offers.length / itemsPerPage);
      
      if (page > totalPages) {
        await interaction.editReply({
          content: `❌ Strona ${page} nie istnieje. Dostępne strony: 1-${totalPages}`,
        });
        return;
      }

      // Sortuj oferty po ID (od najnowszych)
      const sortedOffers = [...offers].sort((a, b) => {
        const idA = parseInt(a.id?.split('_')[0] || 0, 10);
        const idB = parseInt(b.id?.split('_')[0] || 0, 10);
        return idB - idA;
      });
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageOffers = sortedOffers.slice(startIndex, endIndex);

      const embed = new EmbedBuilder()
        .setColor(0xD4A574)
        .setTitle('🛫 Lista ofert lotniczych')
        .setDescription(`Znaleziono **${offers.length}** ofert`)
        .setFooter({ text: `Strona ${page}/${totalPages} • Użyj /lista-ofert strona:X aby zmienić stronę` })
        .setTimestamp();

      for (const offer of pageOffers) {
        // Obsługa zarówno starej struktury (miasto, kraj, kodWylotu, kodPrzylotu) 
        // jak i nowej (skad, dokad)
        const from = offer.skad || offer.kodWylotu || '???';
        const to = offer.dokad || offer.miasto || '???';
        const country = offer.kraj ? `(${offer.kraj})` : '';
        const price = offer.cena || 'Brak ceny';
        const departure = offer.dataWylotu || '??';
        const return_ = offer.dataPowrotu || '??';
        
        // Skróć ID dla czytelności
        const shortId = offer.id ? offer.id.split('_')[0]?.slice(-6) || offer.id.slice(0, 10) : '???';

        embed.addFields({
          name: `${shortId}... ${from} → ${to} ${country}`,
          value: `💰 ${price} | 📅 ${departure} → ${return_}`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error listing offers:', error);
      await interaction.editReply({
        content: '❌ Wystąpił błąd podczas pobierania listy ofert. Spróbuj ponownie później.',
      });
    }
  },
};
