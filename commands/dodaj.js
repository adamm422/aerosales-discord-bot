/**
 * Komenda /dodaj - Dodaje nową ofertę lotniczą (dwuetapowa - 5 pól na modal)
 */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { parseOfferData, parseOfferDataStep2 } = require('../utils/validation');
const { addOffer } = require('../utils/github');

// Tymczasowe przechowywanie danych z pierwszego kroku
const pendingOffers = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dodaj')
    .setDescription('Dodaje nową ofertę lotniczą do strony'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('dodaj-modal-krok1')
      .setTitle('🛫 Dodaj ofertę - Krok 1/2');

    // 5 pól (limit Discord)
    const skadInput = new TextInputBuilder()
      .setCustomId('skad')
      .setLabel('📍 Skąd (miasto KOD)')
      .setPlaceholder('np. Warszawa WMI')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const dokadInput = new TextInputBuilder()
      .setCustomId('dokad')
      .setLabel('🎯 Dokąd (miasto KOD)')
      .setPlaceholder('np. Londyn STN')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const kiedyInput = new TextInputBuilder()
      .setCustomId('kiedy')
      .setLabel('📅 Kiedy (dd.mm-dd.mm.rr)')
      .setPlaceholder('np. 07.04-14.04.26')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const czasPrzesiadkiInput = new TextInputBuilder()
      .setCustomId('czasPrzesiadki')
      .setLabel('⏱️ Czas lotu, przesiadki')
      .setPlaceholder('np. 2.30, 0 (czas, liczba przesiadek)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(30);

    const cenaInput = new TextInputBuilder()
      .setCustomId('cena')
      .setLabel('💰 Cena (PLN)')
      .setPlaceholder('np. 230')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    const row1 = new ActionRowBuilder().addComponents(skadInput);
    const row2 = new ActionRowBuilder().addComponents(dokadInput);
    const row3 = new ActionRowBuilder().addComponents(kiedyInput);
    const row4 = new ActionRowBuilder().addComponents(czasPrzesiadkiInput);
    const row5 = new ActionRowBuilder().addComponents(cenaInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    try {
      await interaction.showModal(modal);
    } catch (error) {
      if (error.code === 40060 || error.code === 10062) {
        return;
      }
      throw error;
    }
  },

  async handleModalKrok1(interaction) {
    if (interaction.customId !== 'dodaj-modal-krok1') return false;

    console.log('[DODAJ] Krok 1 - rozpoczynam');

    try {
      console.log('[DODAJ] deferReply...');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      console.log('[DODAJ] deferReply OK');

      // Pobierz dane z pierwszego formularza
      const rawData = {
        skad: interaction.fields.getTextInputValue('skad'),
        dokad: interaction.fields.getTextInputValue('dokad'),
        kiedy: interaction.fields.getTextInputValue('kiedy'),
        czasPrzesiadki: interaction.fields.getTextInputValue('czasPrzesiadki'),
        cena: interaction.fields.getTextInputValue('cena'),
      };
      console.log('[DODAJ] Pobrane dane:', rawData);

      // Walidacja podstawowa
      const { parseMiastoZKodem, parseDateRange, validateCena, parseCzasLotu, parsePrzesiadki } = require('../utils/validation');
      const errors = [];

      const skadResult = parseMiastoZKodem(rawData.skad);
      if (!skadResult.valid) errors.push(`Skąd: ${skadResult.error}`);

      const dokadResult = parseMiastoZKodem(rawData.dokad);
      if (!dokadResult.valid) errors.push(`Dokąd: ${dokadResult.error}`);

      const kiedyResult = parseDateRange(rawData.kiedy);
      if (!kiedyResult.valid) errors.push(`Kiedy: ${kiedyResult.error}`);

      const cenaResult = validateCena(rawData.cena + ' PLN');
      if (!cenaResult.valid) errors.push(`Cena: ${cenaResult.error}`);

      // Parsuj czas i przesiadki (format: "2.30, 0" lub "2.30,0")
      const czasPrzesiadkiParts = rawData.czasPrzesiadki.split(',').map(s => s.trim());
      if (czasPrzesiadkiParts.length !== 2) {
        errors.push('Czas i przesiadki: Użyj formatu "czas, przesiadki" (np. "2.30, 0")');
      } else {
        const czasResult = parseCzasLotu(czasPrzesiadkiParts[0]);
        const przesiadkiResult = parsePrzesiadki(czasPrzesiadkiParts[1]);
        if (!czasResult.valid) errors.push(`Czas lotu: ${czasResult.error}`);
        if (!przesiadkiResult.valid) errors.push(`Przesiadki: ${przesiadkiResult.error}`);
      }

      if (errors.length > 0) {
        console.log('[DODAJ] Błędy walidacji:', errors);
        await interaction.editReply({
          content: `❌ Błąd walidacji:\n${errors.join('\n')}`,
        });
        return true;
      }

      // Zapisz dane tymczasowo
      const tempId = `${interaction.user.id}_${Date.now()}`;
      pendingOffers.set(tempId, rawData);
      console.log('[DODAJ] Zapisano dane, tempId:', tempId);

      // Pokaż podsumowanie i przycisk do kroku 2
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🛫 Krok 1/2 - Dane podstawowe')
        .addFields(
          { name: '📍 Skąd', value: rawData.skad, inline: true },
          { name: '🎯 Dokąd', value: rawData.dokad, inline: true },
          { name: '📅 Kiedy', value: rawData.kiedy, inline: true },
          { name: '💰 Cena', value: rawData.cena + ' PLN', inline: true },
          { name: '⏱️ Czas i przesiadki', value: rawData.czasPrzesiadki, inline: true },
        )
        .setFooter({ text: 'Kliknij "Dodaj link" aby przejść do kroku 2' });

      const continueButton = new ButtonBuilder()
        .setCustomId(`dodaj-krok2-${tempId}`)
        .setLabel('➡️ Dodaj link')
        .setStyle(ButtonStyle.Primary);

      const cancelButton = new ButtonBuilder()
        .setCustomId(`dodaj-anuluj-${tempId}`)
        .setLabel('❌ Anuluj')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(continueButton, cancelButton);

      console.log('[DODAJ] Wysyłam podsumowanie...');
      await interaction.editReply({
        content: '',
        embeds: [summaryEmbed],
        components: [row],
      });
      console.log('[DODAJ] Krok 1 zakończony sukcesem');

      return true;

    } catch (error) {
      console.error('[DODAJ] BŁĄD w kroku 1:', error);
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: `❌ Wystąpił błąd: ${error.message}`,
          });
        }
      } catch (e) {
        console.log('[DODAJ] Nie można wysłać odpowiedzi o błędzie');
      }
      return true;
    }
  },

  async handleButton(interaction) {
    console.log('[DODAJ] handleButton, customId:', interaction.customId);
    
    // Anulowanie
    if (interaction.customId.startsWith('dodaj-anuluj-')) {
      const tempId = interaction.customId.replace('dodaj-anuluj-', '');
      pendingOffers.delete(tempId);

      try {
        await interaction.update({
          content: '❌ Dodawanie oferty zostało anulowane.',
          embeds: [],
          components: [],
        });
      } catch (e) {
        try {
          await interaction.reply({
            content: '❌ Dodawanie oferty zostało anulowane.',
            flags: MessageFlags.Ephemeral
          });
        } catch (e2) {}
      }
      return true;
    }

    // Przejście do kroku 2
    if (interaction.customId.startsWith('dodaj-krok2-')) {
      const tempId = interaction.customId.replace('dodaj-krok2-', '');
      const offerData = pendingOffers.get(tempId);

      if (!offerData) {
        try {
          await interaction.reply({
            content: '❌ Sesja wygasła. Rozpocznij dodawanie oferty od nowa.',
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          try {
            await interaction.update({
              content: '❌ Sesja wygasła. Rozpocznij dodawanie oferty od nowa.',
              embeds: [],
              components: [],
            });
          } catch (e2) {}
        }
        return true;
      }

      // Drugi modal - tylko link
      const modal = new ModalBuilder()
        .setCustomId(`dodaj-modal-krok2-${tempId}`)
        .setTitle('🛬 Dodaj ofertę - Krok 2/2');

      const linkInput = new TextInputBuilder()
        .setCustomId('link')
        .setLabel('🔗 Link do oferty (przycisk "Kup bilet")')
        .setPlaceholder('https://www.przykladowy-link.pl')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(500);

      const row1 = new ActionRowBuilder().addComponents(linkInput);
      modal.addComponents(row1);

      try {
        await interaction.showModal(modal);
      } catch (error) {
        console.error('Error showing modal 2:', error);
        pendingOffers.delete(tempId);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '❌ Wystąpił błąd podczas otwierania formularza.',
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (e) {}
      }
      return true;
    }

    return false;
  },

  async handleModalKrok2(interaction) {
    console.log('[DODAJ] Krok 2 - rozpoczynam');
    if (!interaction.customId.startsWith('dodaj-modal-krok2-')) return false;

    const tempId = interaction.customId.replace('dodaj-modal-krok2-', '');
    console.log('[DODAJ] tempId:', tempId);
    
    const offerData = pendingOffers.get(tempId);
    console.log('[DODAJ] offerData:', offerData ? 'znaleziono' : 'nie znaleziono');

    if (!offerData) {
      try {
        await interaction.reply({
          content: '❌ Sesja wygasła. Rozpocznij dodawanie oferty od nowa.',
          flags: MessageFlags.Ephemeral,
        });
      } catch (e) {}
      return true;
    }

    try {
      console.log('[DODAJ] deferReply...');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      console.log('[DODAJ] deferReply OK');

      const link = interaction.fields.getTextInputValue('link');
      console.log('[DODAJ] Link:', link);

      // Połącz wszystkie dane
      const fullData = {
        ...offerData,
        link,
      };
      console.log('[DODAJ] fullData:', JSON.stringify(fullData, null, 2));

      // Pobierz istniejące oferty (do generowania ID)
      const { getAllOffers } = require('../utils/github');
      const existingOffers = await getAllOffers();

      // Parsuj wszystkie dane
      console.log('[DODAJ] Parsuję dane...');
      const result = parseOfferDataStep2(fullData, existingOffers);
      console.log('[DODAJ] parseOfferDataStep2 result:', result.valid ? 'OK' : 'BŁĄD', result.errors);

      if (!result.valid) {
        pendingOffers.delete(tempId);
        await interaction.editReply({
          content: `❌ Błąd walidacji:\n${result.errors.join('\n')}`,
        });
        return true;
      }

      console.log('[DODAJ] Zapisuję ofertę...');
      // Zapisz ofertę
      const saveResult = await addOffer(result.offer);
      console.log('[DODAJ] addOffer result:', saveResult.success ? 'OK' : 'BŁĄD', saveResult.error || '');
      pendingOffers.delete(tempId);

      if (!saveResult.success) {
        await interaction.editReply({
          content: `❌ Błąd podczas zapisywania: ${saveResult.error}`,
        });
        return true;
      }

      // Sukces
      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Oferta została dodana!')
        .setDescription(`**${result.offer.kodWylotu}** → **${result.offer.miasto}**`)
        .addFields(
          { name: '📅 Data wylotu', value: result.offer.dataWylotu, inline: true },
          { name: '💰 Cena', value: result.offer.cena, inline: true },
          { name: '🛫 Z', value: result.offer.kodWylotu, inline: true },
          { name: '🛬 Do', value: result.offer.kodPrzylotu, inline: true },
          { name: '⏱️ Czas lotu', value: result.offer.czas, inline: true },
          { name: '🔄 Przesiadki', value: result.offer.przesiadki, inline: true },
          { name: '🔗 Link', value: `[Kup bilet](${result.offer.link})`, inline: false }
        )
        .setFooter({
          text: `Dodano przez ${interaction.user.tag} | ID: ${result.offer.id}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({
        content: '',
        embeds: [successEmbed],
      });

      return true;

    } catch (error) {
      console.error('Error in modal krok 2:', error);
      pendingOffers.delete(tempId);
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ Wystąpił błąd podczas dodawania oferty.',
          });
        }
      } catch (e) {}
      return true;
    }
  },
};
