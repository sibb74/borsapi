# BörsAPI – Integrationsverktyg & MCP-server

Detta repository innehåller officiella integrationsverktyg, kodexempel och källkoden för MCP-servern till [BörsAPI](https://borsapi.se) — Sveriges moderna REST-API för finansiell data från Sverige (Nasdaq Stockholm, First North, Spotlight, NGM), USA (S&P 500, Nasdaq 100) och svenska värdepappersfonder (PPM & UCITS).

---

## 📂 Innehåll

1. **[MCP-server (Model Context Protocol)](#-mcp-server-model-context-protocol)** — Fråga din AI (Cursor, Claude, Windsurf) direkt om svensk och amerikansk börs- och fonddata.
2. **[Fler integrationsexempel (Google Sheets, Excel, Python...)](#-fler-integrationsexempel-google-sheets-excel-python)** — Färdiga kodsnuttar för kalkylark och egna skript.

---

## 🤖 MCP-server (Model Context Protocol)

[![npm version](https://img.shields.io/npm/v/@borsapi/mcp-server.svg)](https://www.npmjs.com/package/@borsapi/mcp-server)

Med vår MCP-server kan du ställa frågor och hämta standardiserad finansiell data för svenska och amerikanska börsbolag samt svenska fonder direkt i AI-verktyg som **Cursor**, **Claude Desktop** och **Windsurf**.

### Krav
- **Node.js** 18 eller senare
- En **BörsAPI-nyckel** ([skapa ett gratis konto på borsapi.se](https://borsapi.se/dashboard) för att få en nyckel)

### Developer Sandbox (Testa helt gratis)
Du kan utveckla och utvärdera MCP-servern helt utan kvotförbrukning (0 kvotanrop) med våra sandbox-tillgångar:
- **Volvo:** `VOLV-A`, `VOLV-B`
- **SKF:** `SKF-A`, `SKF-B`
- **Spiltan Aktiefond Investmentbolag:** `SE0000429821`

Anrop mot dessa fungerar alltid – även om din månadskvot skulle vara slut.

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

Följande 23 verktyg görs tillgängliga för din AI-assistent när du kör MCP-servern:

| Verktyg | Beskrivning |
|---------|-------------|
| `search_companies` | Sök och lista bolag i Sverige och USA (S&P 500, Nasdaq 100). Filtrera på namn, ticker, ISIN, bransch, marknad eller land (`country: SE/US`). *(Volvo och SKF är 0 kvot i Sandbox)* |
| `get_company` | Hämta detaljerad bolagsinformation för svenska eller amerikanska bolag via UUID, ISIN eller ticker (t.ex. `VOLV-B`, `AAPL`) |
| `get_company_coverage` | Se vilka rapportperioder och rapporttyper (års-/kvartalsrapporter) som finns tillgängliga för ett bolag |
| `list_reports` | Hämta finansiella rapporter med filter. `merge=true` ger en rad per period |
| `get_report` | Hämta en specifik rapport för en period (konsoliderad resultat-, balans- och kassaflödesanalys) |
| `search_funds` | Sök och lista svenska fonder (PPM & UCITS). Filtrera på kategori, förvaltare, ISIN och sortera på avgifter eller avkastning (1m, 3m, ytd, 1y, 3y, 5y) *(Spiltan är 0 kvot)* |
| `get_fund` | Hämta detaljerad fondmetadata, avgifter, kategori, PPM-nummer, förvaltare och länk till officiellt KID-faktablad |
| `get_fund_nav` | Historisk daglig NAV-kurs för en fond *(Gratis / 0 kvotavdrag på alla planer, Spiltan SE0000429821 har full historik)* |
| `get_fund_holdings` | Hämta portföljinnehav och aktievikter för en fond kopplat till BörsAPI-aktier *(Gratis / 0 kvotavdrag)* |
| `get_company_short_positions` | Hämta alla råa blankningspositioner för ett bolag från FI *(Gratis / 0 kvotavdrag, max 6 mån historik för Basic)* |
| `get_company_short_statistics` | Hämta aggregerad blankningsstatistik (% totalt blankat, antal blankare) för ett bolag *(Gratis / 0 kvotavdrag)* |
| `list_short_positions` | Lista Sveriges mest blankade bolag och aktiva positioner *(Gratis / 0 kvotavdrag)* |
| `list_insider_transactions` | Hämta insynstransaktioner för alla bolag (`from_date`, `to_date`, `limit`, `offset`) *(Gratis / 0 kvotavdrag, max 6 mån för Basic)* |
| `get_company_insider_transactions` | Hämta insynstransaktioner (köp/sälj/tilldelning av ledande befattningshavare) från FI *(Gratis / 0 kvotavdrag, max 6 mån för Basic)* |
| `get_company_insider_statistics` | Hämta aggregerad insynsstatistik (30d, 90d och 365d nettoköp och VD-aktivitet, 365d kräver Hobby/Pro) *(Gratis / 0 kvotavdrag)* |
| `export_company_reports` | Exportera bolagsrapporter till CSV-format |
| `request_company_priority` | Önska prioriterad skrapning av ett oskrapat bolag |
| `get_report_calendar` | Kommande rapporter och bolagshändelser inom ett datumintervall *(0 kvot)* |
| `get_company_calendar` | Kalender för ett bolag via UUID, ISIN eller ticker *(0 kvot)* |
| `get_market_feed` | Samlat marknadsflöde över börshändelser (nya rapporter, insynshandel, blankning, kalender) |
| `get_latest_reports` | Hämta de senast registrerade finansiella rapporterna över hela börsen (Sverige och USA) |
| `get_coverage_stats` | Statistik om databasens totala täckning (kräver ej autentisering) |
| `check_api_key` | Kontrollera din API-nyckels status, abonnemangsplan och återstående månadskvot *(Gratis / 0 kvotavdrag)* |

### Teckenkonvention
All finansiell data följer BörsAPI:s standard:
- **Positiva tal:** intäkter, tillgångar, kassaflödesinflöden
- **Negativa tal:** kostnader, utgifter, skatt, skulder, kassaflödesutflöden

---

## Exempel på prompts (Frågor till din AI)

När du har lagt till servern kan du ställa frågor i naturligt språk direkt till din AI:

- *"Sök efter Volvo på BörsAPI (Sandbox)"*
- *"Hämta resultaträkningen för H&M (HM-B) för 2024-Q3"*
- *"Hämta senaste rapporten för Apple (AAPL)"*
- *"Sök efter Spiltans fonder och visa deras avgifter och avkastning"*
- *"Hämta historisk NAV-kurs för Spiltan Aktiefond Investmentbolag"*
- *"Vilka är de största innehaven i fonden SE0000429821?"*
- *"Visa insynshandel för Investor under de senaste 90 dagarna"*
- *"Har VD i Volvo köpt eller sålt aktier det senaste året?"*
- *"Vilka är Sveriges mest blankade bolag just nu?"*
- *"När släpper svenska storbolag sina delårsrapporter nästa månad?"*
- *"Exportera Atlas Copcos årsrapporter till CSV"*
- *"Hur mycket API-kvot har jag kvar på mitt BörsAPI-konto?"*

---

## Kvoter och begränsningar

MCP-anrop räknas mot samma månadskvot som dina vanliga REST API-anrop:

| Plan | Månadskvot | Developer Sandbox (Volvo, SKF, Spiltan) |
|------|------------|-----------------------------------------|
| **Basic (Gratis)** | 100 anrop / 30 dagar | Obegränsat (0 kvotavdrag) |
| **Hobby (99 kr/mån)** | 3 000 anrop / 30 dagar | Obegränsat (0 kvotavdrag) |
| **Pro (249 kr/mån)** | 15 000 anrop / 30 dagar | Obegränsat (0 kvotavdrag) |

*Notera: Insynshandel, blankning, fond-NAV, fondinnehav, kalender, marknadsflöde och nyckelkontroll (`check_api_key`) är helt kostnadsfria (0 kvotavdrag). Finansiella rapporter och bolagssökningar räknas mot månadskvoten, förutom för bolagen i Developer Sandbox (Volvo och SKF) samt fonden Spiltan Aktiefond Investmentbolag som alltid ger 0 kvotavdrag.*

Du kan köra verktyget `check_api_key` för att se din nuvarande plan, förbrukning och återstående kvot.

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
