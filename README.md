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
| `search_companies` | Sök och lista svenska noterade bolag. Varje bolag har `has_reports` och `report_count` |
| `get_company` | Hämta detaljerad bolagsinformation via UUID, ISIN eller ticker |
| `get_company_coverage` | Se vilka rapportperioder och rapporttyper (års-/kvartalsrapporter) som finns tillgängliga för ett bolag |
| `list_reports` | Hämta finansiella rapporter med filter. `merge=true` ger en rad per period |
| `get_report` | Hämta en specifik rapport för en period (konsoliderad resultat-, balans- och kassaflödesanalys) |
| `get_company_short_positions` | Hämta alla råa blankningspositioner för ett bolag från FI *(Gratis / 0 kvotavdrag, max 6 mån historik för Free)* |
| `get_company_short_statistics` | Hämta aggregerad blankningsstatistik (% totalt blankat, antal blankare) för ett bolag *(Gratis / 0 kvotavdrag)* |
| `list_short_positions` | Lista Sveriges mest blankade bolag och aktiva positioner *(Gratis / 0 kvotavdrag)* |
| `list_insider_transactions` | Hämta insynstransaktioner för alla bolag (`from_date`, `to_date`, `limit`, `offset`) *(Gratis / 0 kvotavdrag, max 6 mån för Free)* |
| `get_company_insider_transactions` | Hämta insynstransaktioner (köp/sälj/tilldelning av ledande befattningshavare) från FI *(Gratis / 0 kvotavdrag, max 6 mån för Free)* |
| `get_company_insider_statistics` | Hämta aggregerad insynsstatistik (30d, 90d och 365d nettoköp och VD-aktivitet, 365d kräver Hobby/Pro) *(Gratis / 0 kvotavdrag)* |
| `export_company_reports` | Exportera bolagsrapporter till CSV-format |
| `request_company_priority` | Önska prioriterad skrapning av ett osrkapat bolag |
| `get_report_calendar` | Kommande rapporter och bolagshändelser inom ett datumintervall *(0 kvot)* |
| `get_company_calendar` | Kalender för ett bolag via UUID, ISIN eller ticker *(0 kvot)* |
| `get_coverage_stats` | Statistik om databasens totala täckning (kräver ej autentisering) |
| `check_api_key` | Kontrollera din API-nyckels status och återstående kvot *(Gratis / 0 kvotavdrag)* |

### Teckenkonvention
All finansiell data följer BörsAPI:s standard:
- **Positiva tal:** intäkter, tillgångar, kassaflödesinflöden
- **Negativa tal:** kostnader, utgifter, skatt, skulder, kassaflödesutflöden

---

## Exempel på prompts (Frågor till din AI)

När du har lagt till servern kan du ställa frågor i naturligt språk direkt till din AI:

- *"Sök efter Volvo på BörsAPI"*
- *"Hämta resultaträkningen för H&M (HM-B) för 2024-Q3"*
- *"Visa insynshandel för Investor under de senaste 90 dagarna"*
- *"Har VD i Volvo köpt eller sålt aktier det senaste året?"*
- *"Vilka är Sveriges mest blankade bolag just nu?"*
- *"Exportera Atlas Copcos årsrapporter till CSV"*
- *"Prioritera skrapning av ett nytt bolag på börsen"*
- *"Hur mycket API-kvot har jag kvar på mitt BörsAPI-konto?"*

---

## Kvoter och begränsningar

MCP-anrop räknas mot samma kvot som dina vanliga REST API-anrop:

| Plan | Gräns |
|------|-------|
| **Gratis Beta** | 100 rapporter totalt (livstidspott för utvärdering) |
| **Hobby** | 100 rapporter per dag |
| **Pro** | 500 rapporter per dag |

*Notera: Varje enskild finansiell rapport som returneras i ett svar räknas som 1 enhet. Bolagssökning kostar 1 enhet, medan verktyg för blankning, insynshandel och nyckelkontroll (`check_api_key`) är kostnadsfria (0 kvotavdrag). För Gratis-konton gäller max 6 månaders historik för insynshandel och historiska blankningspositioner samt 30d/90d för insynsstatistik; Hobby och Pro har fullständig och obegränsad historisk tillgång.*

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
