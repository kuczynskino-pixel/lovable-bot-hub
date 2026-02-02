import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';

import { addHurtowniaCommand } from './commands/add-hurtownia.js';
import { updateHurtowniaCommand } from './commands/update-hurtownia.js';
import { listHurtownieCommand } from './commands/list-hurtownie.js';
import { searchHurtowniaCommand } from './commands/search-hurtownia.js';
import { configCommand } from './commands/config.js';

config();

const commands = [
  addHurtowniaCommand,
  updateHurtowniaCommand,
  listHurtownieCommand,
  searchHurtowniaCommand,
  configCommand,
].map(cmd => cmd.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Rejestruję ${commands.length} komend slash...`);

    // Register commands to specific guild (faster for development)
    if (process.env.DISCORD_GUILD_ID) {
      const data = await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commands }
      );
      console.log(`✅ Zarejestrowano ${data.length} komend (guild: ${process.env.DISCORD_GUILD_ID})`);
    } else {
      // Global commands (takes up to 1 hour to propagate)
      const data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Zarejestrowano ${data.length} komend globalnie`);
    }
  } catch (error) {
    console.error('❌ Błąd rejestracji komend:', error);
  }
})();
