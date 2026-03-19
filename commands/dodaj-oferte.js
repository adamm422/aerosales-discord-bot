/**
 * Komenda /dodaj-oferte - Dodaje nową ofertę lotniczą (dwuetapowa)
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
  ComponentType,
} = require('discord.js');

const { validateOffer } = require('../utils/validation');
const { addOffer } = require('../utils/github');

// Tymczasowe przechowywanie danych z pierwszego modalu (w pamięci)
const pendingOffers = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dodaj-oferte')
    .setDescription('Dodaje nową ofertę lotniczą do strony'),

  async execute(interaction) {
    // Tworzenie pierwszego modalu z podstawowymi danymi
    const modal = new ModalBuilder()
      .setCustomId('dodaj-oferte-modal-1')
      .setTitle('🛫 Krok 1/2: Podstawowe dane');

    // Pola modalu - 5 pól (limit Discord)
    const skadInput = new TextInputBuilder()
      .setCustomId('skad')
      .setLabel('📍 Skąd (miasto wylotu)')
      .setPlaceholder('np. Warszawa')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const dokadInput = new TextInputBuilder()
      .setCustomId('dokad')
      .setLabel('🎯 Dokąd (miasto przylotu)')
      .setPlaceholder('np. Londyn')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const dataWylotuInput = new TextInputBuilder()
      .setCustomId('dataWylotu')
      .setLabel('📅 Data wylotu (dd/mm/rrrr)')
      .setPlaceholder('np. 15/04/2026')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const dataPowrotuInput = new TextInputBuilder()
      .setCustomId('dataPowrotu')
      .setLabel('📅 Data powrotu (dd/mm/rrrr)')
      .setPlaceholder('np. 22/04/2026')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const cenaInput = new TextInputBuilder()
      .setCustomId('cena')
      .setLabel('💰 Cena (PLN) - opcjonalnie')
      .setPlaceholder('np. 299 PLN lub zostaw puste')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Rządy modalu
    const row1 = new ActionRowBuilder().addComponents(skadInput);
    const row2 = new ActionRowBuilder().addComponents(dokadInput);
    const row3 = new ActionRowBuilder().addComponents(dataWylotuInput);
    const row4 = new ActionRowBuilder().addComponents(dataPowrotuInput);
    const row5 = new ActionRowBuilder().addComponents(cenaInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    // Pokazanie modalu użytkownikowi
    try {
      await interaction.showModal(modal);
    } catch (error) {
      if (error.code === 40060 || error.code === 10062) {
        return;
      }
      throw error;
    }
  },

  async handleModal1(interaction) {
    if (interaction.customId !== 'dodaj-oferte-modal-1') return false;

    try {
      // DeferReply na początku
      try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      } catch (deferError) {
        if (deferError.code === 40060 || deferError.code === 10062) {
          return true;
        }
        throw deferError;
      }

      // Pobierz dane z pierwszego modalu
      const skad = interaction.fields.getTextInputValue('skad');
      const dokad = interaction.fields.getTextInputValue('dokad');
      const dataWylotu = interaction.fields.getTextInputValue('dataWylotu');
      const dataPowrotu = interaction.fields.getTextInputValue('dataPowrotu');
      const cena = interaction.fields.getTextInputValue('cena') || '';

      // Walidacja podstawowych danych
      const { validateData, validateMiasto, validateCena } = require('../utils/validation');
      
      const errors = [];
      
      const skadResult = validateMiasto(skad);
      if (!skadResult.valid) errors.push(`Skąd: ${skadResult.error}`);
      
      const dokadResult = validateMiasto(dokad);
      if (!dokadResult.valid) errors.push(`Dokąd: ${dokadResult.error}`);
      
      const dataWylotuResult = validateData(dataWylotu);
      if (!dataWylotuResult.valid) errors.push(`Data wylotu: ${dataWylotuResult.error}`);
      
      const dataPowrotuResult = validateData(dataPowrotu);
      if (!dataPowrotuResult.valid) errors.push(`Data powrotu: ${dataPowrotuResult.error}`);

      if (cena) {
        const cenaResult = validateCena(cena);
        if (!cenaResult.valid) errors.push(`Cena: ${cenaResult.error}`);
      }

      if (errors.length > 0) {
        await interaction.editReply({
          content: `❌ Błąd walidacji:\n${errors.join('\n')}`,
        });
        return true;
      }

      // Zapisz dane tymczasowo
      const tempId = `${interaction.user.id}_${Date.now()}`;
      pendingOffers.set(tempId, {
        skad: skadResult.value,
        dokad: dokadResult.value,
        dataWylotu: dataWylotuResult.value,
        dataPowrotu: dataPowrotuResult.value,
        cena: cena ? (await validateCena(cena)).value : '',
      });

      // Utwórz embed z podsumowaniem i przyciskiem do kolejnego kroku
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🛫 Krok 1/2 - Dane podstawowe')
        .addFields(
          { name: '📍 Skąd', value: skadResult.value, inline: true },
          { name: '🎯 Dokąd', value: dokadResult.value, inline: true },
          { name: '📅 Wylot', value: dataWylotuResult.value, inline: true },
          { name: '📅 Powrót', value: dataPowrotuResult.value, inline: true },
        );
      
      if (cena) {
        summaryEmbed.addFields({ name: '💰 Cena', value: (await validateCena(cena)).value, inline: true });
      }

      summaryEmbed.setFooter({ 
        text: 'Kliknij "Dodaj szczegóły" aby przejść do kroku 2',
      });

      // Przycisk do drugiego modalu
      const continueButton = new ButtonBuilder()
        .setCustomId(`dodaj-oferte-krok2-${tempId}`)
        .setLabel('➡️ Dodaj szczegóły')
        .setStyle(ButtonStyle.Primary);

      const cancelButton = new ButtonBuilder()
        .setCustomId(`dodaj-oferte-anuluj-${tempId}`)
        .setLabel('❌ Anuluj')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(continueButton, cancelButton);

      await interaction.editReply({ 
        content: '',
        embeds: [summaryEmbed],
        components: [row],
        flags: MessageFlags.Ephemeral,
      });

      return true;

    } catch (error) {
      console.error('Error in modal 1:', error);
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ Wystąpił błąd podczas przetwarzania danych.',
          });
        }
      } catch (e) {
        console.log('Could not send error reply');
      }
      return true;
    }
  },

  async handleButton(interaction) {
    // Obsługa anulowania
    if (interaction.customId.startsWith('dodaj-oferte-anuluj-')) {
      const tempId = interaction.customId.replace('dodaj-oferte-anuluj-', '');
      pendingOffers.delete(tempId);
      
      try {
        await interaction.update({
          content: '❌ Dodawanie oferty zostało anulowane.',
          embeds: [],
          components: [],
        });
      } catch (e) {
        await interaction.reply({ 
          content: '❌ Dodawanie oferty zostało anulowane.', 
          flags: MessageFlags.Ephemeral 
        });
      }
      return true;
    }

    // Obsługa przejścia do kroku 2
    if (interaction.customId.startsWith('dodaj-oferte-krok2-')) {
      const tempId = interaction.customId.replace('dodaj-oferte-krok2-', '');
      const offerData = pendingOffers.get(tempId);

      if (!offerData) {
        try {
          await interaction.reply({
            content: '❌ Sesja wygasła. Rozpocznij dodawanie oferty od nowa.',
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await interaction.update({
            content: '❌ Sesja wygasła. Rozpocznij dodawanie oferty od nowa.',
            embeds: [],
            components: [],
          });
        }
        return true;
      }

      // Drugi modal - szczegóły lotu
      const modal = new ModalBuilder()
        .setCustomId(`dodaj-oferte-modal-2-${tempId}`)
        .setTitle('🛬 Krok 2/2: Szczegóły lotu');

      const czasLotuInput = new TextInputBuilder()
        .setCustomId('czasLotu')
        .setLabel('⏱️ Czas lotu')
        .setPlaceholder('np. 2 godz. 30 min lub 150 min')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const przesiadkiInput = new TextInputBuilder()
        .setCustomId('przesiadki')
        .setLabel('🔄 Przesiadki (liczba)')
        .setPlaceholder('np. 0, 1, 2 lub "bez"')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20);

      const opisInput = new TextInputBuilder()
        .setCustomId('opis')
        .setLabel('📝 Opis miejsca docelowego')
        .setPlaceholder('np. wielokulturowa stolica Wielkiej Brytanii...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(1000);

      const linkInput = new TextInputBuilder()
        .setCustomId('link')
        .setLabel('🔗 Link do oferty (przycisk "Kup bilet")')
        .setPlaceholder('https://www.przykladowy-link-do-oferty.pl')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const row1 = new ActionRowBuilder().addComponents(czasLotuInput);
      const row2 = new ActionRowBuilder().addComponents(przesiadkiInput);
      const row3 = new ActionRowBuilder().addComponents(opisInput);
      const row4 = new ActionRowBuilder().addComponents(linkInput);

      modal.addComponents(row1, row2, row3, row4);

      try {
        await interaction.showModal(modal);
      } catch (error) {
        console.error('Error showing modal 2:', error);
        pendingOffers.delete(tempId);
        try {
          await interaction.reply({
            content: '❌ Wystąpił błąd podczas otwierania formularza.',
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await interaction.update({
            content: '❌ Wystąpił błąd podczas otwierania formularza.',
            embeds: [],
            components: [],
          });
        }
      }
      return true;
    }

    return false;
  },

  async handleModal2(interaction) {
    if (!interaction.customId.startsWith('dodaj-oferte-modal-2-')) return false;

    const tempId = interaction.customId.replace('dodaj-oferte-modal-2-', '');
    const offerData = pendingOffers.get(tempId);

    if (!offerData) {
      try {
        await interaction.reply({
          content: '❌ Sesja wygasła. Dane pierwszego kroku zostały utracone.',
          flags: MessageFlags.Ephemeral,
        });
      } catch (e) {
        // Interaction might have been handled
      }
      return true;
    }

    try {
      // DeferReply na początku
      try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      } catch (deferError) {
        if (deferError.code === 40060 || deferError.code === 10062) {
          pendingOffers.delete(tempId);
          return true;
        }
        throw deferError;
      }

      // Pobierz dane z drugiego modalu
      const czasLotu = interaction.fields.getTextInputValue('czasLotu');
      const przesiadki = interaction.fields.getTextInputValue('przesiadki');
      const opis = interaction.fields.getTextInputValue('opis') || '';
      const link = interaction.fields.getTextInputValue('link') || '';

      // Połącz dane z obu kroków
      const fullOfferData = {
        ...offerData,
        czasLotu,
        przesiadki,
        opis,
        link,
      };

      // Walidacja wszystkich danych
      const validation = validateOffer(fullOfferData, []);

      if (!validation.valid) {
        pendingOffers.delete(tempId);
        await interaction.editReply({
          content: `❌ Błąd walidacji:\n${validation.errors.join('\n')}`,
        });
        return true;
      }

      // Wykonaj operację GitHub
      const result = await addOffer(validation.offer);
      pendingOffers.delete(tempId);

      if (!result.success) {
        await interaction.editReply({
          content: `❌ Błąd podczas zapisywania: ${result.error}`,
        });
        return true;
      }

      // Sukces - wyświetl potwierdzenie
      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Oferta została dodana!')
        .setDescription(`**${validation.offer.skad}** → **${validation.offer.dokad}**`)
        .addFields(
          { name: '📅 Wylot', value: validation.offer.dataWylotu, inline: true },
          { name: '📅 Powrót', value: validation.offer.dataPowrotu, inline: true },
          { name: '⏱️ Czas lotu', value: validation.offer.czasLotu, inline: true },
          { name: '🔄 Przesiadki', value: validation.offer.przesiadki === '0' ? 'Bez przesiadek' : `${validation.offer.przesiadki} przesiadki`, inline: true },
        );

      if (validation.offer.cena) {
        successEmbed.addFields({ name: '💰 Cena', value: validation.offer.cena, inline: true });
      }

      if (validation.offer.opis) {
        successEmbed.addFields({ name: '📝 Opis', value: validation.offer.opis.substring(0, 200) + (validation.offer.opis.length > 200 ? '...' : ''), inline: false });
      }

      if (validation.offer.link) {
        successEmbed.addFields({ name: '🔗 Link', value: `[Kup bilet](${validation.offer.link})`, inline: false });
      }

      successEmbed
        .setFooter({ 
          text: `Dodano przez ${interaction.user.tag} | ID: ${validation.offer.id}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ 
        content: '',
        embeds: [successEmbed],
        flags: MessageFlags.Ephemeral,
      });

      return true;

    } catch (error) {
      console.error('Error in modal 2:', error);
      pendingOffers.delete(tempId);
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ Wystąpił nieoczekiwany błąd podczas dodawania oferty.',
          });
        }
      } catch (e) {
        console.log('Could not send error reply');
      }
      return true;
    }
  },

  // Cleanup starych sesji (opcjonalnie - można wywoływać periodycznie)
  cleanupPendingOffers() {
    const now = Date.now();
    const timeout = 15 * 60 * 1000; // 15 minut
    
    for (const [key, value] of pendingOffers.entries()) {
      const timestamp = parseInt(key.split('_')[1], 10);
      if (now - timestamp > timeout) {
        pendingOffers.delete(key);
      }
    }
  },
};
