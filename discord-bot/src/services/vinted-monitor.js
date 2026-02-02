import { EmbedBuilder } from 'discord.js';
import { getConfig, addProcessedSale, isSaleProcessed } from './config-store.js';

const VINTED_API_URL = process.env.VINTED_API_URL || 'https://www.vinted.pl/api/v2';

/**
 * Fetch sold orders from Vinted Pro API
 * @param {string} accountName 
 * @param {string} token 
 * @returns {Promise<Array>}
 */
async function fetchVintedSales(accountName, token) {
  try {
    const response = await fetch(`${VINTED_API_URL}/orders/sold`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'VintedBot/1.0',
      },
    });

    if (!response.ok) {
      console.error(`❌ Błąd Vinted API dla ${accountName}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.orders || data.items || [];
  } catch (error) {
    console.error(`❌ Błąd pobierania sprzedaży dla ${accountName}:`, error.message);
    return [];
  }
}

/**
 * Check all Vinted accounts for new sales
 * @param {Client} client 
 */
export async function checkVintedSales(client) {
  const config = getConfig();
  const accounts = config.vintedAccounts || {};
  const salesChannelId = config.salesChannelId || process.env.SALES_CHANNEL_ID;
  const salesRoleId = config.salesPingRoleId || process.env.SALES_PING_ROLE_ID;

  if (!salesChannelId) {
    console.warn('⚠️ Kanał sprzedaży nie jest skonfigurowany');
    return;
  }

  if (Object.keys(accounts).length === 0) {
    console.warn('⚠️ Brak skonfigurowanych kont Vinted');
    return;
  }

  const salesChannel = await client.channels.fetch(salesChannelId).catch(() => null);
  
  if (!salesChannel) {
    console.error('❌ Nie mogę znaleźć kanału sprzedaży');
    return;
  }

  for (const [accountName, accountData] of Object.entries(accounts)) {
    const token = accountData.token;
    
    if (!token) {
      console.warn(`⚠️ Brak tokenu dla konta ${accountName}`);
      continue;
    }

    const sales = await fetchVintedSales(accountName, token);
    
    for (const sale of sales) {
      // Generate unique sale ID
      const saleId = `${accountName}_${sale.id || sale.order_id || sale.transaction_id}`;
      
      // Skip if already processed
      if (isSaleProcessed(saleId)) {
        continue;
      }

      // Only process recent sales (within last 24 hours)
      const saleDate = new Date(sale.created_at || sale.date || sale.sold_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (saleDate < dayAgo) {
        addProcessedSale(saleId); // Mark old sales as processed
        continue;
      }

      // Create sale notification embed
      const embed = new EmbedBuilder()
        .setTitle('✅ SPRZEDAŻ VINTED')
        .setColor(0x09B83E)
        .addFields(
          { name: '👤 Konto', value: accountName, inline: true },
          { name: '📦 Produkt', value: sale.item_title || sale.title || 'Nieznany produkt', inline: true },
          { name: '💰 Cena', value: `${sale.total_price || sale.price || '?'} ${sale.currency || 'PLN'}`, inline: true },
          { name: '📅 Data', value: saleDate.toLocaleString('pl-PL'), inline: true },
          { name: '📊 Status', value: getStatusEmoji(sale.status) + ' ' + (sale.status || 'sold'), inline: true },
        )
        .setTimestamp();

      // Add order link if available
      if (sale.url || sale.order_url) {
        embed.addFields({
          name: '🔗 Link',
          value: `[Otwórz zamówienie](${sale.url || sale.order_url})`,
          inline: false,
        });
      }

      // Add buyer info if available
      if (sale.buyer_username || sale.buyer) {
        embed.addFields({
          name: '🛒 Kupujący',
          value: sale.buyer_username || sale.buyer?.login || 'Nieznany',
          inline: true,
        });
      }

      // Send notification
      const rolePing = salesRoleId ? `<@&${salesRoleId}>` : '';
      
      await salesChannel.send({
        content: rolePing,
        embeds: [embed],
      });

      // Mark as processed
      addProcessedSale(saleId);
      
      console.log(`📣 Nowa sprzedaż: ${accountName} - ${sale.item_title || 'produkt'}`);
    }
  }
}

function getStatusEmoji(status) {
  const statusMap = {
    'sold': '🔵',
    'paid': '💳',
    'shipped': '📦',
    'delivered': '✅',
    'cancelled': '❌',
    'pending': '⏳',
  };
  return statusMap[status?.toLowerCase()] || '🔵';
}
