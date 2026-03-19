/**
 * Skrypt do rejestracji komend slash na serwerze Discord
 * Uruchom: node deploy-commands.js
 */

const { REST, Routes } = require('discord.js');
require('dotenv').config();

const { loadCommands } = require('./utils/commandLoader');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID; // Opcjonalne - dla komend serwerowych

if (!token) {
  console.error('❌ DISCORD_TOKEN nie jest ustawiony w pliku .env');
  process.exit(1);
}

if (!clientId) {
  console.error('❌ DISCORD_CLIENT_ID nie jest ustawiony w pliku .env');
  console.error('   Możesz znaleźć Client ID w zakładce OAuth2 w ustawieniach aplikacji Discord');
  process.exit(1);
}

// Załaduj komendy
const commands = loadCommands();
const commandsData = commands.map(command => command.data.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Rozpoczynam rejestrację ${commandsData.length} komend...`);

    let data;

    if (guildId) {
      // Rejestruj komendy dla konkretnego serwera (szybsze aktualizacje)
      console.log(`📍 Rejestruję komendy dla serwera: ${guildId}`);
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsData },
      );
    } else {
      // Rejestruj globalne komendy (wymagają do 1h na propagację)
      console.log('🌍 Rejestruję globalne komendy...');
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsData },
      );
    }

    console.log(`✅ Pomyślnie zarejestrowano ${data.length} komend!`);
    console.log('\n📋 Zarejestrowane komendy:');
    data.forEach(cmd => {
      console.log(`   • /${cmd.name} - ${cmd.description}`);
    });

  } catch (error) {
    console.error('❌ Błąd podczas rejestracji komend:', error);
    process.exit(1);
  }
})();