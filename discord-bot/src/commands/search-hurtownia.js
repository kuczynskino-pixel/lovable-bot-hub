import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getConfig } from '../services/config-store.js';
import { findHurtowniaThread } from '../utils/hurtownia-finder.js';

export const searchHurtowniaCommand = new SlashCommandBuilder()
  .setName('search-hurtownia')
  .setDescription('Szukaj hurtowni po nazwie')
  .addStringOption(option =>
    option
      .setName('nazwa')
      .setDescription('Nazwa lub fragment nazwy hurtowni')
      .setRequired(true)
      .setMaxLength(100)
  );

export async function handleSearchHurtownia(interaction, client) {
  await interaction.deferReply();

  const nazwa = interaction.options.getString('nazwa');
  const config = getConfig();
  const channelId = config.hurtownieChannelId || process.env.HURTOWNIE_CHANNEL_ID;

  if (!channelId) {
    return interaction.editReply({
      content: '❌ Kanał hurtowni nie jest skonfigurowany.',
    });
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  
  if (!channel) {
    return interaction.editReply({
      content: '❌ Nie mogę znaleźć kanału hurtowni.',
    });
  }

  try {
    const result = await findHurtowniaThread(channel, nazwa);
    
    if (!result) {
      return interaction.editReply({
        content: `🔍 Nie znaleziono hurtowni pasującej do: **${nazwa}**`,
      });
    }

    const { data, threadUrl, message } = result;

    // Parse prices for display
    const parsedCeny = data.ceny
      ? data.ceny.split(',').map(p => `• ${p.trim()}`).join('\n')
      : 'Brak danych';

    const embed = new EmbedBuilder()
      .setTitle(`🔍 ${data.nazwa}`)
      .setColor(0x5865F2)
      .addFields(
        { name: '📧 Kontakt', value: data.kontakt || 'Brak', inline: true },
        { name: '📞 Telefon', value: data.telefon || 'Brak', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '💰 Cennik', value: parsedCeny, inline: false },
      )
      .setTimestamp();

    if (data.link) {
      embed.addFields({ name: '🔗 Katalog/Link', value: data.link, inline: false });
    }

    if (data.notatki) {
      embed.addFields({ name: '📝 Notatki', value: data.notatki, inline: false });
    }

    embed.addFields({
      name: '📌 Thread',
      value: `[Otwórz dyskusję](${threadUrl})`,
      inline: false,
    });

    // Get reactions count
    const reactions = message.reactions.cache;
    if (reactions.size > 0) {
      const reactionStr = reactions.map(r => `${r.emoji} ${r.count}`).join(' | ');
      embed.addFields({ name: '👍 Reakcje', value: reactionStr, inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Błąd wyszukiwania hurtowni:', error);
    await interaction.editReply({
      content: '❌ Wystąpił błąd podczas wyszukiwania.',
    });
  }
}
