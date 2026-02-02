import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = join(__dirname, '../../data/config.json');

let config = {
  hurtownieChannelId: process.env.HURTOWNIE_CHANNEL_ID || null,
  salesChannelId: process.env.SALES_CHANNEL_ID || null,
  salesPingRoleId: process.env.SALES_PING_ROLE_ID || null,
  adminRoleId: process.env.ADMIN_ROLE_ID || null,
  editorRoleId: process.env.EDITOR_ROLE_ID || null,
  vintedAccounts: {},
  processedSales: [], // Track processed sale IDs to avoid duplicates
};

export function loadConfig(client) {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf8');
      const saved = JSON.parse(data);
      config = { ...config, ...saved };
      console.log('📂 Wczytano konfigurację z pliku');
    }
    
    // Parse VINTED_ACCOUNTS from env if present
    if (process.env.VINTED_ACCOUNTS) {
      const accounts = process.env.VINTED_ACCOUNTS.split(',');
      accounts.forEach(acc => {
        const [name, token] = acc.split(':');
        if (name && token) {
          config.vintedAccounts[name.trim()] = { 
            token: token.trim(),
            fromEnv: true 
          };
        }
      });
      console.log(`🛍️ Załadowano ${Object.keys(config.vintedAccounts).length} kont Vinted z ENV`);
    }
  } catch (error) {
    console.error('❌ Błąd wczytywania konfiguracji:', error);
  }
}

export function saveConfig() {
  try {
    // Ensure data directory exists
    const dataDir = dirname(CONFIG_FILE);
    if (!existsSync(dataDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(dataDir, { recursive: true });
    }
    
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('💾 Zapisano konfigurację');
  } catch (error) {
    console.error('❌ Błąd zapisywania konfiguracji:', error);
  }
}

export function getConfig() {
  return { ...config };
}

export function updateConfig(updates) {
  config = { ...config, ...updates };
  saveConfig();
  return config;
}

export function addProcessedSale(saleId) {
  if (!config.processedSales.includes(saleId)) {
    config.processedSales.push(saleId);
    // Keep only last 1000 sales to prevent memory bloat
    if (config.processedSales.length > 1000) {
      config.processedSales = config.processedSales.slice(-1000);
    }
    saveConfig();
  }
}

export function isSaleProcessed(saleId) {
  return config.processedSales.includes(saleId);
}
