import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getConfig } from '../services/config-store.js';
import { getAllHurtownie } from '../utils/hurtownia-finder.js';

const ITEMS_PER_PAGE = 10;

export const listHurtownieCommand = new SlashCommandBuilder()
  .setName('list-hurtownie')
  .setDescription('Wyświetl listę wszystkich hurtowni');

export async function handleListHurtownie(interaction, client) {
  await interaction.deferReply();

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
    const hurtownie = await getAllHurtownie(channel);
    
    if (hurtownie.length === 0) {
      return interaction.editReply({
        content: '📭 Brak hurtowni w bazie. Użyj `/add-hurtownia` aby dodać pierwszą.',
      });
    }

    const totalPages = Math.ceil(hurtownie.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageItems = hurtownie.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle('🏭 Lista Hurtowni')
        .setColor(0x5865F2)
        .setDescription(
          pageItems.map((h, i) => {
            const num = start + i + 1;
            const prices = h.data.ceny 
              ? h.data.ceny.split(',').slice(0, 2).join(', ') + (h.data.ceny.split(',').length > 2 ? '...' : '')
              : 'brak cen';
            return `**${num}. ${h.data.nazwa}**\n` +
                   `   📧 ${h.data.kontakt}\n` +
                   `   💰 ${prices}\n` +
                   `   🔗 [Thread](${h.threadUrl})`;
          }).join('\n\n')
        )
        .setFooter({ 
          text: `Strona ${page + 1}/${totalPages} • Łącznie: ${hurtownie.length} hurtowni` 
        })
        .setTimestamp();

      return embed;
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('hurtownie_first')
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('hurtownie_prev')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('hurtownie_page')
            .setLabel(`${page + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('hurtownie_next')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1),
          new ButtonBuilder()
            .setCustomId('hurtownie_last')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1),
        );
    };

    const response = await interaction.editReply({
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [generateButtons(currentPage)] : [],
    });

    if (totalPages <= 1) return;

    // Button collector
    const collector = response.createMessageComponentCollector({
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ 
          content: '❌ Tylko osoba która wywołała komendę może nawigować.', 
          ephemeral: true 
        });
      }

      switch (i.customId) {
        case 'hurtownie_first':
          currentPage = 0;
          break;
        case 'hurtownie_prev':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'hurtownie_next':
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case 'hurtownie_last':
          currentPage = totalPages - 1;
          break;
      }

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  } catch (error) {
    console.error('Błąd listowania hurtowni:', error);
    await interaction.editReply({
      content: '❌ Wystąpił błąd podczas pobierania listy hurtowni.',
    });
  }
}
