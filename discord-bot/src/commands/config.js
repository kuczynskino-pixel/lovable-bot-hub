import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getConfig, saveConfig, updateConfig } from '../services/config-store.js';

export const configCommand = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Konfiguracja bota')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub
      .setName('hurtownie-channel')
      .setDescription('Ustaw kanał dla hurtowni')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Kanał tekstowy')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('sales-channel')
      .setDescription('Ustaw kanał dla powiadomień Vinted')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Kanał tekstowy')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('sales-role')
      .setDescription('Ustaw rolę do pingowania przy sprzedaży')
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Rola do pingowania')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('admin-role')
      .setDescription('Ustaw rolę admina')
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Rola admina')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('editor-role')
      .setDescription('Ustaw rolę edytora')
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Rola edytora')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('vinted-accounts')
      .setDescription('Dodaj/aktualizuj konto Vinted')
      .addStringOption(opt =>
        opt
          .setName('name')
          .setDescription('Nazwa konta (np. PL_Main)')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('token')
          .setDescription('Token API Vinted')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('show')
      .setDescription('Pokaż aktualną konfigurację')
  );

export async function handleConfig(interaction, client) {
  const subcommand = interaction.options.getSubcommand();
  const config = getConfig();

  switch (subcommand) {
    case 'hurtownie-channel': {
      const channel = interaction.options.getChannel('channel');
      updateConfig({ hurtownieChannelId: channel.id });
      await interaction.reply({
        content: `✅ Kanał hurtowni ustawiony na: ${channel}`,
        ephemeral: true,
      });
      break;
    }

    case 'sales-channel': {
      const channel = interaction.options.getChannel('channel');
      updateConfig({ salesChannelId: channel.id });
      await interaction.reply({
        content: `✅ Kanał sprzedaży Vinted ustawiony na: ${channel}`,
        ephemeral: true,
      });
      break;
    }

    case 'sales-role': {
      const role = interaction.options.getRole('role');
      updateConfig({ salesPingRoleId: role.id });
      await interaction.reply({
        content: `✅ Rola do pingowania przy sprzedaży: ${role}`,
        ephemeral: true,
      });
      break;
    }

    case 'admin-role': {
      const role = interaction.options.getRole('role');
      updateConfig({ adminRoleId: role.id });
      await interaction.reply({
        content: `✅ Rola admina ustawiona: ${role}`,
        ephemeral: true,
      });
      break;
    }

    case 'editor-role': {
      const role = interaction.options.getRole('role');
      updateConfig({ editorRoleId: role.id });
      await interaction.reply({
        content: `✅ Rola edytora ustawiona: ${role}`,
        ephemeral: true,
      });
      break;
    }

    case 'vinted-accounts': {
      const name = interaction.options.getString('name');
      const token = interaction.options.getString('token');
      
      const currentConfig = getConfig();
      const accounts = currentConfig.vintedAccounts || {};
      accounts[name] = { token, addedAt: new Date().toISOString() };
      updateConfig({ vintedAccounts: accounts });
      
      await interaction.reply({
        content: `✅ Konto Vinted **${name}** zostało dodane/zaktualizowane.`,
        ephemeral: true,
      });
      break;
    }

    case 'show': {
      const cfg = getConfig();
      const accountNames = cfg.vintedAccounts ? Object.keys(cfg.vintedAccounts) : [];
      
      const lines = [
        `**📁 Kanał hurtowni:** ${cfg.hurtownieChannelId ? `<#${cfg.hurtownieChannelId}>` : '❌ Nie ustawiony'}`,
        `**📣 Kanał sprzedaży:** ${cfg.salesChannelId ? `<#${cfg.salesChannelId}>` : '❌ Nie ustawiony'}`,
        `**🔔 Rola sales ping:** ${cfg.salesPingRoleId ? `<@&${cfg.salesPingRoleId}>` : '❌ Nie ustawiona'}`,
        `**👑 Rola admin:** ${cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : '❌ Nie ustawiona'}`,
        `**✏️ Rola edytor:** ${cfg.editorRoleId ? `<@&${cfg.editorRoleId}>` : '❌ Nie ustawiona'}`,
        `**🛍️ Konta Vinted:** ${accountNames.length > 0 ? accountNames.join(', ') : '❌ Brak'}`,
      ];

      await interaction.reply({
        content: `⚙️ **Konfiguracja bota:**\n\n${lines.join('\n')}`,
        ephemeral: true,
      });
      break;
    }
  }
}
