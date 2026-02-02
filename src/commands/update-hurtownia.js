import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { getConfig } from '../services/config-store.js';
import { findHurtowniaThread } from '../utils/hurtownia-finder.js';

export const updateHurtowniaCommand = new SlashCommandBuilder()
  .setName('update-hurtownia')
  .setDescription('Aktualizuj dane hurtowni')
  .addStringOption(option =>
    option
      .setName('nazwa')
      .setDescription('Nazwa hurtowni do aktualizacji')
      .setRequired(true)
      .setMaxLength(100)
  )
  .addStringOption(option =>
    option
      .setName('pole')
      .setDescription('Pole do aktualizacji (np. "kontakt=nowy@email.pl" lub "cena-butelka=55zł")')
      .setRequired(true)
      .setMaxLength(500)
  );

export async function handleUpdateHurtownia(interaction, client) {
  // Check permissions
  if (!await hasPermission(interaction.member)) {
    return interaction.reply({
      content: '❌ Nie masz uprawnień do edycji hurtowni. Wymagana rola admin/edytor.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const nazwa = interaction.options.getString('nazwa');
  const poleUpdate = interaction.options.getString('pole');

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
    // Find the hurtownia thread
    const result = await findHurtowniaThread(channel, nazwa);
    
    if (!result) {
      return interaction.editReply({
        content: `❌ Nie znaleziono hurtowni: **${nazwa}**`,
      });
    }

    const { message, data } = result;

    // Parse the update field
    const [field, value] = poleUpdate.split('=').map(s => s.trim());
    
    if (!field || !value) {
      return interaction.editReply({
        content: '❌ Nieprawidłowy format. Użyj: `pole=wartość` (np. `kontakt=nowy@email.pl`)',
      });
    }

    // Handle price updates (cena-produkt=wartość)
    if (field.startsWith('cena-')) {
      const productName = field.replace('cena-', '');
      let currentCeny = data.ceny || '';
      
      // Update or add price
      const cenyArray = currentCeny.split(',').map(c => c.trim()).filter(Boolean);
      const productIndex = cenyArray.findIndex(c => 
        c.toLowerCase().includes(productName.toLowerCase())
      );
      
      if (productIndex >= 0) {
        cenyArray[productIndex] = `${productName}=${value}`;
      } else {
        cenyArray.push(`${productName}=${value}`);
      }
      
      data.ceny = cenyArray.join(', ');
    } else {
      // Direct field update
      const validFields = ['kontakt', 'telefon', 'ceny', 'link', 'notatki'];
      if (!validFields.includes(field)) {
        return interaction.editReply({
          content: `❌ Nieprawidłowe pole. Dostępne: ${validFields.join(', ')}`,
        });
      }
      data[field] = value;
    }

    data.updatedBy = interaction.user.id;
    data.updatedAt = new Date().toISOString();

    // Rebuild embed
    const parsedCeny = data.ceny
      ? data.ceny.split(',').map(p => `• ${p.trim()}`).join('\n')
      : 'Brak danych';

    const embed = new EmbedBuilder()
      .setTitle(`🏭 ${data.nazwa}`)
      .setColor(0x57F287) // Green for updated
      .addFields(
        { name: '📧 Kontakt', value: data.kontakt || 'Brak', inline: true },
        { name: '📞 Telefon', value: data.telefon || 'Brak', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '💰 Cennik', value: parsedCeny, inline: false },
      )
      .setTimestamp()
      .setFooter({ text: `Zaktualizowane przez ${interaction.user.tag}` });

    if (data.link) {
      embed.addFields({ name: '🔗 Katalog/Link', value: data.link, inline: false });
    }

    if (data.notatki) {
      embed.addFields({ name: '📝 Notatki', value: data.notatki, inline: false });
    }

    // Store updated JSON
    embed.setDescription(`\`\`\`json\n${JSON.stringify(data)}\n\`\`\``);

    await message.edit({ embeds: [embed] });

    await interaction.editReply({
      content: `✅ Zaktualizowano hurtownię **${nazwa}**!\n📝 Zmiana: \`${field}\` → \`${value}\``,
    });
  } catch (error) {
    console.error('Błąd aktualizacji hurtowni:', error);
    await interaction.editReply({
      content: '❌ Wystąpił błąd podczas aktualizacji hurtowni.',
    });
  }
}
