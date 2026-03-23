const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
require('dotenv').config();

const { loadCommands } = require('./utils/commandLoader');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Load commands
client.commands = loadCommands();

// Ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Loaded ${client.commands.size} command(s)`);
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        console.error(`Command ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        
        // Jeśli komenda pokazała modal lub interaction wygasł, nie możemy odpowiadać
        if (error.code === 40060 || error.code === 10062) {
          console.log('Modal was shown or interaction expired, skipping error reply');
          return;
        }
        
        // Odpowiedz tylko jeśli interaction nie był jeszcze obsłużony
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ Wystąpił błąd podczas wykonywania komendy.',
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.reply({
              content: '❌ Wystąpił błąd podczas wykonywania komendy.',
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyError) {
          console.log('Could not send error reply');
        }
      }
    }
    
    // Handle button interactions
    if (interaction.isButton()) {
      console.log('[INDEX] Button clicked:', interaction.customId);
      const command = client.commands.get('dodaj');
      if (command && command.handleButton) {
        console.log('[INDEX] Calling handleButton');
        const handled = await command.handleButton(interaction);
        if (handled) return;
      }
    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      console.log('[INDEX] Modal submitted:', interaction.customId);
      const command = client.commands.get('dodaj');
      if (!command) {
        console.log('[INDEX] Command "dodaj" not found');
        return;
      }

      // Krok 1 - pierwszy modal
      if (interaction.customId === 'dodaj-modal-krok1') {
        console.log('[INDEX] Handling krok 1');
        await command.handleModalKrok1(interaction);
        return;
      }

      // Krok 2 - drugi modal (customId zawiera tempId)
      if (interaction.customId.startsWith('dodaj-modal-krok2-')) {
        console.log('[INDEX] Handling krok 2');
        await command.handleModalKrok2(interaction);
        return;
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN is not set in environment variables!');
  process.exit(1);
}

client.login(token);
