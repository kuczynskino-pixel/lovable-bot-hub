import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { getConfig } from '../services/config-store.js';

export const addHurtowniaCommand = new SlashCommandBuilder()
  .setName('add-hurtownia')
  .setDescription('Dodaj nową hurtownię do bazy')
  .addStringOption(option =>
    option
      .setName('nazwa')
      .setDescription('Nazwa hurtowni')
      .setRequired(true)
      .setMaxLength(100)
  )
  .addStringOption(option =>
    option
      .setName('kontakt')
      .setDescription('Email kontaktowy')
      .setRequired(true)
      .setMaxLength(255)
  )
  .addStringOption(option =>
    option
      .setName('telefon')
      .setDescription('Numer telefonu (np. +48123456789)')
      .setRequired(false)
      .setMaxLength(20)
  )
  .addStringOption(option =>
    option
      .setName('ceny')
      .setDescription('Lista cen (np. "butelka=50zł, koszulka=30zł")')
      .setRequired(false)
      .setMaxLength(1000)
  )
  .addStringOption(option =>
    option
      .setName('link')
      .setDescription('Link do katalogu/strony')
      .setRequired(false)
      .setMaxLength(500)
  )
  .addStringOption(option =>
    option
      .setName('notatki')
      .setDescription('Dodatkowe informacje')
      .setRequired(false)
      .setMaxLength(1000)
  );

export async function handleAddHurtownia(interaction, client) {
  // Check permissions
  if (!await hasPermission(interaction.member)) {
    return interaction.reply({
      content: '❌ Nie masz uprawnień do dodawania hurtowni. Wymagana rola admin/edytor.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const config = getConfig();
  const channelId = config.hurtownieChannelId || process.env.HURTOWNIE_CHANNEL_ID;

  if (!channelId) {
    return interaction.editReply({
      content: '❌ Kanał hurtowni nie jest skonfigurowany. Użyj `/config hurtownie-channel`.',
    });
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  
  if (!channel) {
    return interaction.editReply({
      content: '❌ Nie mogę znaleźć kanału hurtowni. Sprawdź konfigurację.',
    });
  }

  // Get options
  const nazwa = interaction.options.getString('nazwa');
  const kontakt = interaction.options.getString('kontakt');
  const telefon = interaction.options.getString('telefon');
  const ceny = interaction.options.getString('ceny');
  const link = interaction.options.getString('link');
  const notatki = interaction.options.getString('notatki');

  // Parse prices into formatted list
  const parsedCeny = ceny
    ? ceny.split(',').map(p => `• ${p.trim()}`).join('\n')
    : 'Brak danych';

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`🏭 ${nazwa}`)
    .setColor(0x5865F2)
    .addFields(
      { name: '📧 Kontakt', value: kontakt, inline: true },
      { name: '📞 Telefon', value: telefon || 'Brak', inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: '💰 Cennik', value: parsedCeny, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: `Dodane przez ${interaction.user.tag}` });

  if (link) {
    embed.addFields({ name: '🔗 Katalog/Link', value: link, inline: false });
  }

  if (notatki) {
    embed.addFields({ name: '📝 Notatki', value: notatki, inline: false });
  }

  // Store data in embed for later retrieval
  const hurtowniaData = {
    nazwa,
    kontakt,
    telefon,
    ceny,
    link,
    notatki,
    createdBy: interaction.user.id,
    createdAt: new Date().toISOString(),
  };

  embed.setDescription(`\`\`\`json\n${JSON.stringify(hurtowniaData)}\n\`\`\``);

  try {
    // Create thread for this hurtownia
    const starterMessage = await channel.send({ embeds: [embed] });
    
    const thread = await starterMessage.startThread({
      name: `📦 ${nazwa}`,
      autoArchiveDuration: 10080, // 7 days
      reason: `Hurtownia: ${nazwa}`,
    });

    // Add reactions for quick actions
    await starterMessage.react('✅'); // Verified
    await starterMessage.react('⭐'); // Favorite
    await starterMessage.react('📞'); // Need to call
    await starterMessage.react('💬'); // Need discussion

    await interaction.editReply({
      content: `✅ Dodano hurtownię **${nazwa}**!\n📌 Thread: ${thread.url}`,
    });
  } catch (error) {
    console.error('Błąd dodawania hurtowni:', error);
    await interaction.editReply({
      content: '❌ Wystąpił błąd podczas dodawania hurtowni.',
    });
  }
}
