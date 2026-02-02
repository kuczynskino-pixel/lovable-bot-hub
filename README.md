# 🏭 Hurtownie & Vinted Sales Bot

Discord bot do zarządzania hurtowniami i monitorowania sprzedaży Vinted.

## ✨ Funkcje

### Slash Commands

| Komenda | Opis |
|---------|------|
| `/add-hurtownia` | Dodaj nową hurtownię z kontaktem, cenami, linkami |
| `/update-hurtownia` | Aktualizuj dane istniejącej hurtowni |
| `/list-hurtownie` | Paginowana lista wszystkich hurtowni |
| `/search-hurtownia` | Szukaj hurtowni po nazwie |
| `/config` | Konfiguracja bota (tylko admin) |

### Monitoring Vinted
- Automatyczne sprawdzanie sprzedaży co 15 minut
- Wsparcie dla wielu kont Vinted
- Powiadomienia z pingiem roli @sales
- Tracking statusów: sold → paid → shipped → delivered

## 🚀 Setup

### 1. Discord Developer Portal

1. Idź do [Discord Developer Portal](https://discord.com/developers/applications)
2. Kliknij "New Application"
3. Nazwij aplikację, np. "Hurtownie Bot"
4. Przejdź do **Bot** → "Add Bot"
5. Skopiuj **TOKEN** (będziesz potrzebować)
6. Włącz **Message Content Intent** w Bot settings
7. Przejdź do **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Manage Threads`, `Embed Links`, `Add Reactions`, `Read Message History`
8. Skopiuj URL i otwórz w przeglądarce aby zaprosić bota

### 2. Konfiguracja Environment

Skopiuj `.env.example` do `.env` i wypełnij:

```bash
cp .env.example .env
```

```env
# Discord
DISCORD_TOKEN=twoj_bot_token
DISCORD_CLIENT_ID=id_aplikacji (z General Information)
DISCORD_GUILD_ID=id_twojego_serwera (PPM na serwer → Kopiuj ID)

# Kanały (opcjonalne - można ustawić przez /config)
HURTOWNIE_CHANNEL_ID=
SALES_CHANNEL_ID=

# Role (opcjonalne - można ustawić przez /config)
ADMIN_ROLE_ID=
EDITOR_ROLE_ID=
SALES_PING_ROLE_ID=

# Vinted (format: nazwa:token,nazwa2:token2)
VINTED_ACCOUNTS=PL_Main:abc123token,PL_Second:xyz789token
```

### 3. Instalacja i uruchomienie

```bash
# Instalacja zależności
npm install

# Rejestracja komend slash (jednorazowo)
npm run register

# Uruchomienie bota
npm start

# Lub w trybie development (auto-reload)
npm run dev
```

## 🚂 Deploy na Railway

1. Utwórz nowy projekt na [Railway](https://railway.app)
2. Połącz z GitHub repo
3. Dodaj environment variables z `.env`
4. Railway automatycznie uruchomi `npm start`

### railway.json (opcjonalne)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 📦 Deploy na Render

1. Utwórz nowe "Background Worker" na [Render](https://render.com)
2. Połącz z GitHub repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Dodaj environment variables

## 🔧 Konfiguracja przez Discord

Po uruchomieniu bota, użyj `/config` (wymaga admin):

```
/config hurtownie-channel #hurtownie
/config sales-channel #vinted-sales
/config sales-role @sales
/config admin-role @admin
/config editor-role @edytor
/config vinted-accounts name:PL_Main token:abc123
/config show
```

## 📖 Użycie komend

### Dodawanie hurtowni
```
/add-hurtownia nazwa:ABC Hurt kontakt:hurt@abc.pl telefon:+48123456789 ceny:"butelka=50zł, koszulka=30zł" link:https://katalog.abc.pl notatki:Szybka wysyłka
```

### Aktualizacja ceny
```
/update-hurtownia nazwa:ABC Hurt pole:cena-butelka=55zł
```

### Aktualizacja kontaktu
```
/update-hurtownia nazwa:ABC Hurt pole:kontakt=nowy@email.pl
```

### Szukanie
```
/search-hurtownia ABC
```

## 🛍️ Vinted API

Bot używa Vinted Pro API. Potrzebujesz:
1. Konta Vinted Pro
2. Token API (z ustawień konta lub OAuth)

Endpoint: `GET /api/v2/orders/sold`

Tokeny można dodać przez:
- ENV: `VINTED_ACCOUNTS=nazwa:token`
- Discord: `/config vinted-accounts name:nazwa token:twoj_token`

## 📁 Struktura projektu

```
discord-bot/
├── src/
│   ├── commands/
│   │   ├── add-hurtownia.js
│   │   ├── update-hurtownia.js
│   │   ├── list-hurtownie.js
│   │   ├── search-hurtownia.js
│   │   └── config.js
│   ├── services/
│   │   ├── config-store.js
│   │   └── vinted-monitor.js
│   ├── utils/
│   │   ├── permissions.js
│   │   └── hurtownia-finder.js
│   ├── index.js
│   └── register-commands.js
├── data/
│   └── config.json
├── .env.example
├── package.json
└── README.md
```

## ❓ FAQ

**Q: Komendy nie pojawiają się na serwerze?**  
A: Uruchom `npm run register`. Dla komend guild chwilę, globalne do 1h.

**Q: Bot nie odpowiada?**  
A: Sprawdź czy TOKEN jest poprawny i Message Content Intent włączony.

**Q: Jak pobrać ID kanału/roli?**  
A: Włącz Developer Mode w Discord (Ustawienia → Zaawansowane), PPM → Kopiuj ID.

**Q: Vinted nie działa?**  
A: Sprawdź czy token jest aktualny. Vinted może wymagać odświeżenia tokenów.

## 📄 Licencja

MIT
