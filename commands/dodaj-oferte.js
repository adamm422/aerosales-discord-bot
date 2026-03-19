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
  MessageFlags,
} = require('discord.js');

const { validateOffer } = require('../utils/validation');
const { addOffer } = require('../utils/github');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dodaj-oferte')
    .setDescription('Dodaje nową ofertę lotniczą do strony'),

  async execute(interaction) {
    // Tworzenie modalu ze wszystkimi polami (max 5 pól w Discord modal)
    const modal = new ModalBuilder()
      .setCustomId('dodaj-oferte-modal')
      .setTitle('🛫 Dodaj nową ofertę lotniczą');

    // Pola modalu - tylko 5 pól (limit Discord)
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

    // Rządy modalu
    const row1 = new ActionRowBuilder().addComponents(miastoInput);
    const row2 = new ActionRowBuilder().addComponents(krajInput);
    const row3 = new ActionRowBuilder().addComponents(dataWylotuInput);
    const row4 = new ActionRowBuilder().addComponents(dataPowrotuInput);
    const row5 = new ActionRowBuilder().addComponents(cenaInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    // Pokazanie modalu użytkownikowi
    try {
      await interaction.showModal(modal);
    } catch (error) {
      // Jeśli interaction wygasł (3s), ignorujemy błąd
      if (error.code === 40060 || error.code === 10062) {
        // Interaction wygasł - nic nie rób
        return;
      }
      throw error;
    }
  },

  async handleModal(interaction) {
    if (interaction.customId !== 'dodaj-oferte-modal') return;

    try {
      // DeferReply na początku - mamy 15 minut na odpowiedź
      // Jeśli interaction wygasł, po prostu kończymy
      try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      } catch (deferError) {
        if (deferError.code === 40060 || deferError.code === 10062) {
          // Interaction wygasł - nic nie rób
          return;
        }
        throw deferError;
      }

      // Pobierz dane z modalu
      const miasto = interaction.fields.getTextInputValue('miasto');
      const kraj = interaction.fields.getTextInputValue('kraj');
      const dataWylotu = interaction.fields.getTextInputValue('dataWylotu');
      const dataPowrotu = interaction.fields.getTextInputValue('dataPowrotu');
      const cena = interaction.fields.getTextInputValue('cena');

      // Domyślne wartości dla pozostałych pól
      const offerData = {
        miasto,
        kraj,
        dataWylotu,
        dataPowrotu,
        cena,
        kodWylotu: 'WMI',  // Domyślnie Modlin
        kodPrzylotu: 'XXX', // Będzie do uzupełnienia
        czas: '2 godz. 0 min', // Domyślnie
        przesiadki: 'bez przesiadek', // Domyślnie
      };

      // Walidacja danych
      const validation = validateOffer(offerData, []);

      if (!validation.valid) {
        await interaction.editReply({
          content: `❌ Błąd walidacji:\n${validation.errors.join('\n')}`,
        });
        return;
      }

      // Wykonaj operację GitHub
      const result = await addOffer(validation.offer);

      if (!result.success) {
        await interaction.editReply({
          content: `❌ Błąd podczas zapisywania: ${result.error}`,
        });
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

      await interaction.editReply({ 
        content: '',
        embeds: [successEmbed],
        flags: MessageFlags.Ephemeral,
      });

    } catch (error) {
      console.error('Error in modal:', error);
      // Spróbuj odpowiedzieć jeśli możemy
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ Wystąpił nieoczekiwany błąd podczas dodawania oferty.',
          });
        }
      } catch (e) {
        console.log('Could not send error reply');
      }
    }
  },
};