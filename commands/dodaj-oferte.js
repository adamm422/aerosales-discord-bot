/**
 * Komenda /dodaj-oferte - Dodaje nową ofertę lotniczą
 */

const { 
  SlashCommandBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');

const { validateOffer } = require('../utils/validation');
const { addOffer } = require('../utils/github');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dodaj-oferte')
    .setDescription('Dodaje nową ofertę lotniczą do strony'),

  async execute(interaction) {
    // Tworzenie modalu z polami do wypełnienia
    const modal = new ModalBuilder()
      .setCustomId('dodaj-oferte-modal')
      .setTitle('🛫 Dodaj nową ofertę lotniczą');

    // Pola modalu
    const miastoInput = new TextInputBuilder()
      .setCustomId('miasto')
      .setLabel('🏙️ Miasto docelowe')
      .setPlaceholder('np. Chania (Kreta)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const krajInput = new TextInputBuilder()
      .setCustomId('kraj')
      .setLabel('🌍 Kraj')
      .setPlaceholder('np. Grecja')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const dataWylotuInput = new TextInputBuilder()
      .setCustomId('dataWylotu')
      .setLabel('📅 Data wylotu')
      .setPlaceholder('np. 6 kwietnia 2026')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const dataPowrotuInput = new TextInputBuilder()
      .setCustomId('dataPowrotu')
      .setLabel('📅 Data powrotu')
      .setPlaceholder('np. 15 kwietnia 2026')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const cenaInput = new TextInputBuilder()
      .setCustomId('cena')
      .setLabel('💰 Cena (PLN)')
      .setPlaceholder('np. 246 PLN lub 246')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Pierwszy rząd - miasto i kraj
    const firstRow = new ActionRowBuilder().addComponents(miastoInput);
    const secondRow = new ActionRowBuilder().addComponents(krajInput);
    const thirdRow = new ActionRowBuilder().addComponents(dataWylotuInput);
    const fourthRow = new ActionRowBuilder().addComponents(dataPowrotuInput);
    const fifthRow = new ActionRowBuilder().addComponents(cenaInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

    // Pokazanie modalu użytkownikowi
    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    if (interaction.customId !== 'dodaj-oferte-modal') return;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Pobierz dane z modalu
      const miasto = interaction.fields.getTextInputValue('miasto');
      const kraj = interaction.fields.getTextInputValue('kraj');
      const dataWylotu = interaction.fields.getTextInputValue('dataWylotu');
      const dataPowrotu = interaction.fields.getTextInputValue('dataPowrotu');
      const cena = interaction.fields.getTextInputValue('cena');

      // Pokaż drugi modal z dodatkowymi informacjami
      await this.showSecondModal(interaction, {
        miasto,
        kraj,
        dataWylotu,
        dataPowrotu,
        cena,
      });

    } catch (error) {
      console.error('Error in first modal:', error);
      await interaction.editReply({
        content: '❌ Wystąpił błąd podczas przetwarzania danych. Spróbuj ponownie.',
      });
    }
  },

  async showSecondModal(interaction, firstModalData) {
    // Stworzenie nowego modalu z dodatkowymi polami
    const modal = new ModalBuilder()
      .setCustomId('dodaj-oferte-modal-2')
      .setTitle('🛫 Szczegóły lotu (2/2)');

    const kodWylotuInput = new TextInputBuilder()
      .setCustomId('kodWylotu')
      .setLabel('✈️ Kod lotniska wylotu (IATA)')
      .setPlaceholder('np. WMI (Modlin) lub WAW (Chopin)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(3);

    const kodPrzylotuInput = new TextInputBuilder()
      .setCustomId('kodPrzylotu')
      .setLabel('🛬 Kod lotniska przylotu (IATA)')
      .setPlaceholder('np. CHQ (Chania)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(3);

    const czasInput = new TextInputBuilder()
      .setCustomId('czas')
      .setLabel('⏱️ Czas lotu')
      .setPlaceholder('np. 2 godz. 55 min')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const przesiadkiInput = new TextInputBuilder()
      .setCustomId('przesiadki')
      .setLabel('🔄 Przesiadki (opcjonalnie)')
      .setPlaceholder('np. bez przesiadek lub 1 przesiadka')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Ukryte pole do przekazania danych z pierwszego modala
    const hiddenDataInput = new TextInputBuilder()
      .setCustomId('hiddenData')
      .setLabel('Dane z poprzedniego kroku (nie edytuj)')
      .setValue(JSON.stringify(firstModalData))
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(kodWylotuInput);
    const row2 = new ActionRowBuilder().addComponents(kodPrzylotuInput);
    const row3 = new ActionRowBuilder().addComponents(czasInput);
    const row4 = new ActionRowBuilder().addComponents(przesiadkiInput);
    const row5 = new ActionRowBuilder().addComponents(hiddenDataInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
  },

  async handleSecondModal(interaction) {
    if (interaction.customId !== 'dodaj-oferte-modal-2') return;

    await interaction.deferReply({ ephemeral: false });

    try {
      // Pobierz dane z drugiego modala
      const kodWylotu = interaction.fields.getTextInputValue('kodWylotu');
      const kodPrzylotu = interaction.fields.getTextInputValue('kodPrzylotu');
      const czas = interaction.fields.getTextInputValue('czas');
      const przesiadki = interaction.fields.getTextInputValue('przesiadki') || 'bez przesiadek';
      const hiddenDataStr = interaction.fields.getTextInputValue('hiddenData');

      // Parsuj dane z pierwszego modala
      const firstModalData = JSON.parse(hiddenDataStr);

      // Połącz wszystkie dane
      const offerData = {
        ...firstModalData,
        kodWylotu,
        kodPrzylotu,
        czas,
        przesiadki,
      };

      // Pobierz istniejące oferty do walidacji i generowania ID
      const { getAllOffers } = require('../utils/github');
      const existingOffers = await getAllOffers();

      // Walidacja danych
      const validation = validateOffer(offerData, existingOffers);

      if (!validation.valid) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Błąd walidacji')
          .setDescription('Znaleziono błędy w danych oferty:')
          .addFields(
            validation.errors.map(error => ({ name: '⚠️', value: error, inline: false }))
          )
          .setFooter({ text: 'Popraw dane i spróbuj ponownie' });

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Zapisz ofertę do GitHub
      const result = await addOffer(validation.offer);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Błąd podczas zapisywania')
          .setDescription(result.error)
          .setFooter({ text: 'Spróbuj ponownie później' });

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Sukces - wyświetl potwierdzenie
      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Oferta została dodana!')
        .setDescription(`**${validation.offer.miasto}** (${validation.offer.kraj})`)
        .setThumbnail(validation.offer.flaga)
        .addFields(
          { name: '💰 Cena', value: validation.offer.cena, inline: true },
          { name: '📅 Wylot', value: validation.offer.dataWylotu, inline: true },
          { name: '📅 Powrót', value: validation.offer.dataPowrotu, inline: true },
          { name: '✈️ Trasa', value: `${validation.offer.kodWylotu} → ${validation.offer.kodPrzylotu}`, inline: true },
          { name: '⏱️ Czas lotu', value: validation.offer.czas, inline: true },
          { name: '🔄 Przesiadki', value: validation.offer.przesiadki, inline: true }
        )
        .setFooter({ 
          text: `Dodano przez ${interaction.user.tag} | ID: ${validation.offer.id}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in second modal:', error);
      await interaction.editReply({
        content: '❌ Wystąpił nieoczekiwany błąd podczas dodawania oferty. Spróbuj ponownie później.',
      });
    }
  },
};