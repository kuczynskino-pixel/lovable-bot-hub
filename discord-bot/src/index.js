import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { config } from 'dotenv';
import cron from 'node-cron';

// Commands
import { addHurtowniaCommand, handleAddHurtownia } from './commands/add-hurtownia.js';
import { updateHurtowniaCommand, handleUpdateHurtownia } from './commands/update-hurtownia.js';
import { listHurtownieCommand, handleListHurtownie } from './commands/list-hurtownie.js';
import { searchHurtowniaCommand, handleSearchHurtownia } from './commands/search-hurtownia.js';
import { configCommand, handleConfig } from './commands/config.js';

// Services
import { checkVintedSales } from './services/vinted-monitor.js';
import { loadConfig } from './services/config-store.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Register commands
const commands = [
  { data: addHurtowniaCommand, execute: handleAddHurtownia },
  { data: updateHurtowniaCommand, execute: handleUpdateHurtownia },
  { data: listHurtownieCommand, execute: handleListHurtownie },
  { data: searchHurtowniaCommand, execute: handleSearchHurtownia },
  { data: configCommand, execute: handleConfig },
];

commands.forEach(cmd => {
  client.commands.set(cmd.data.name, cmd);
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot zalogowany jako ${readyClient.user.tag}`);
  console.log(`📡 Serwery: ${readyClient.guilds.cache.size}`);
  
  // Load saved config
  await loadConfig(client);
  
  // Start Vinted monitoring cron (every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Sprawdzam sprzedaże Vinted...');
    try {
      await checkVintedSales(client);
    } catch (error) {
      console.error('❌ Błąd monitorowania Vinted:', error);
    }
  });
  
  console.log('⏰ Cron job Vinted ustawiony (co 15 min)');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Nie znaleziono komendy: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Błąd wykonania komendy ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ Wystąpił błąd podczas wykonywania komendy.',
      ephemeral: true,
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Zamykam bota...');
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
