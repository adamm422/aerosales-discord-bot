const { Client, GatewayIntentBits, Events } = require('discord.js');
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
        
        const errorMessage = {
          content: '❌ Wystąpił błąd podczas wykonywania komendy. Spróbuj ponownie później.',
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      const command = client.commands.get('dodaj-oferte');
      if (command) {
        if (interaction.customId === 'dodaj-oferte-modal') {
          await command.handleModal(interaction);
        } else if (interaction.customId === 'dodaj-oferte-modal-2') {
          await command.handleSecondModal(interaction);
        }
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