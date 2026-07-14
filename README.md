# BörsAPI – Integrationsverktyg & MCP-server

Detta repository innehåller officiella integrationsverktyg, kodexempel och källkoden för MCP-servern till [BörsAPI](https://borsapi.se) — Sveriges moderna REST-API för finansiell data från Nasdaq Stockholm.

---

## 📂 Innehåll

1. **[MCP-server (Model Context Protocol)](#-mcp-server-model-context-protocol)** — Fråga din AI (Cursor, Claude, Windsurf) direkt om svensk börsdata.
2. **[Fler integrationsexempel (Google Sheets, Excel, Python...)](#-fler-integrationsexempel-google-sheets-excel-python)** — Färdiga kodsnuttar för kalkylark och egna skript.

---

## 🤖 MCP-server (Model Context Protocol)

[![npm version](https://img.shields.io/npm/v/@borsapi/mcp-server.svg)](https://www.npmjs.com/package/@borsapi/mcp-server)

Med vår MCP-server kan du ställa frågor och hämta standardiserad finansiell data för svenska börsbolag direkt i AI-verktyg som **Cursor**, **Claude Desktop** och **Windsurf**.

### Krav
- **Node.js** 18 eller senare
- En **BörsAPI-nyckel** ([skapa ett gratis konto på borsapi.se](https://borsapi.se/dashboard) för att få en nyckel)

### Installation & Användning
Du behöver inte installera paketet globalt. De flesta AI-klienter kör servern direkt via `npx`:

```bash
npx -y @borsapi/mcp-server
```

Du hittar även paketet direkt på npm: [@borsapi/mcp-server](https://www.npmjs.com/package/@borsapi/mcp-server).

### Konfiguration
Konfigurera din AI-klient genom att ange din API-nyckel som en miljövariabel (`env`):

| Variabel | Krävs | Standard | Beskrivning |
|----------|-------|----------|-------------|
| `BORSAPI_API_KEY` | **Ja** | — | Din BörsAPI-nyckel (börjar med `fd_...`) |
| `BORSAPI_BASE_URL` | Nej | `https://borsapi.se` | Bas-URL för API:et (används främst under lokal utveckling) |

#### Cursor
Öppna inställningarna i Cursor (Features -> MCP) eller lägg till i din konfigurationsfil (t.ex. `~/.cursor/mcp.json` eller projektets `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_din_api_nyckel_här"
      }
    }
  }
}
```

#### Claude Desktop
Lägg till konfigurationen i din `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_din_api_nyckel_här"
      }
    }
  }
}
```

#### Windsurf
Lägg till följande i din Windsurf MCP-konfiguration:

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_din_api_nyckel_här"
      }
    }
  }
}
```

---

## 📊 Fler integrationsexempel (Google Sheets, Excel, Python...)

Om du inte använder en AI-klient utan vill ansluta BörsAPI till kalkylark eller egna skript, hittar du färdiga kodexempel i katalogen [`examples/`](./examples):

- **[Google Sheets](./examples/google-sheets):** Apps Script-kod för att skapa en egen formel `=BORSAPI()` som hämtar data live till dina celler.
- **[Excel Power Query](./examples/excel):** M-kod för att hämta rapporter direkt till Excel-tabeller.
- **[Python](./examples/python):** Skript för att hämta bolagsrapporter och skriva ut finansiella nyckeltal.
- **[Node.js](./examples/nodejs):** Exempel på REST API-anrop med fetch.

---

## Verktyg (Tools) i MCP-servern

Följande verktyg görs tillgängliga för din AI-assistent när du kör MCP-servern:

| Verktyg | Beskrivning |
|---------|-------------|
| `search_companies` | Sök och lista svenska noterade bolag |
| `get_company` | Hämta detaljerad bolagsinformation via UUID eller ISIN |
| `get_company_coverage` | Se vilka rapportperioder och rapporttyper (års-/kvartalsrapporter) som finns tillgängliga för ett bolag |
| `list_reports` | Hämta finansiella rapporter med filter (t.ex. typ, period, enhet) |
| `get_report` | Hämta en specifik rapport för en period (konsoliderad resultat-, balans- och kassaflödesanalys) |
| `get_coverage_stats` | Statistik om databasens totala täckning (kräver ej autentisering) |
| `check_api_key` | Kontrollera din API-nyckels status och återstående kvot |

### Teckenkonvention
All finansiell data följer BörsAPI:s standard:
- **Positiva tal:** intäkter, tillgångar, kassaflödesinflöden
- **Negativa tal:** kostnader, utgifter, skatt, skulder, kassaflödesutflöden

---

## Exempel på prompts (Frågor till din AI)

När du har lagt till servern kan du ställa frågor i naturligt språk direkt till din AI:

- *"Sök efter Volvo på BörsAPI"*
- *"Hämta resultaträkningen för H&M (HM-B) för 2024-Q3"*
- *"Vilka rapportperioder finns tillgängliga för Atlas Copco?"*
- *"Hur mycket API-kvot har jag kvar på mitt BörsAPI-konto?"*
- *"Jämför omsättningen för Evolution 2023 och 2024"*

---

## Kvoter och begränsningar

MCP-anrop räknas mot samma kvot som dina vanliga REST API-anrop:

| Plan | Gräns |
|------|-------|
| **Gratis Beta** | 100 rapporter totalt (livstidspott för utvärdering) |
| **Hobby** | 100 rapporter per dag |
| **Pro** | 500 rapporter per dag |

*Notera: Varje enskild finansiell rapport som returneras i ett svar räknas som 1 enhet. Att söka efter bolag eller kontrollera din nyckel kostar också 1 enhet.*

Du kan köra verktyget `check_api_key` för att se hur mycket kvot du har kvar.

---

## Lokal utveckling (Development)

Om du vill bygga eller köra MCP-servern lokalt från källkoden:

```bash
# Klona repot och gå till mappen
cd packages/mcp-server
npm install
npm run build
npm test
```

Starta servern lokalt i utvecklingsläge:
```bash
BORSAPI_API_KEY=fd_din_nyckel npm start
```

## Licens

MIT © BörsAPI AB
