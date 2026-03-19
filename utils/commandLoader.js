const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands() {
  const commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  // Create commands directory if it doesn't exist
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log('📁 Created commands directory');
    return commands;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Validate command structure
    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
      console.log(`📥 Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Command at ${filePath} is missing required "data" or "execute" property`);
    }
  }

  return commands;
}

module.exports = { loadCommands };