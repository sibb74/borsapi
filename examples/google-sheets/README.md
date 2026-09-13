# BörsAPI i Google Sheets

Detta bibliotek innehåller färdiga Google Apps Script för att hämta finansiell data, rapporter, nyckeltal, insynshandel, blankning och kalenderhändelser från [BörsAPI](https://borsapi.se) direkt till Google Sheets.

---

## 1. Komplett Aktieanalysmall (`stock-analyzer-apps-script.js`)
Ett fullfjädrat analysverktyg som bygger upp ett professionellt analysark i **Classic Finance**-design med:
- **Översikt & Värdering**: Bolagsinfo, aktiekurs, börsvärde, EV, värderingsmultiplar (P/E, EV/EBIT, EV/EBITDA, P/S, P/B, direktavkastning), lönsamhetsmarginaler, och kommande rapportdatum.
- **Förenklad DCF-modell**: Kassaflödesvärdering baserad på historiskt fritt kassaflöde (FCF) med justerbara parametrar för tillväxt och diskonteringsränta (WACC).
- **Helår (FY)**: 5–10 års komplett resultaträkning, balansräkning och kassaflödesanalys.
- **Kvartal & TTM**: De senaste 8 kvartalen samt rullande 12 månader (TTM).
- **Insyn & Blankning**: Aggregerad insynsstatistik (30d, 90d, 365d), senaste insynstransaktioner och aktuella blankningspositioner (drar 0 requests från API-kvoten!).

### Snabbstart:
1. Öppna ett nytt kalkylark på [Google Sheets](https://sheets.new).
2. Klicka på **Tillägg (Extensions)** -> **Apps Script**.
3. Klistra in innehållet från [stock-analyzer-apps-script.js](stock-analyzer-apps-script.js) och klicka på Spara.
4. Ladda om kalkylarket.
5. Använd den nya menyn **BörsAPI**:
   - Välj **⚙️ Ange API-nyckel** för att spara din nyckel från [borsapi.se/dashboard](https://borsapi.se/dashboard).
   - Välj **🚀 Skapa / Återställ kalkylarkets flikar** för att bygga alla flikar och formler.
   - Skriv in en ticker i cell B3 (t.ex. `VOLV-B` eller `EVO`) och klicka på **🔄 Hämta data för vald aktie**.

---

## 2. Enkel formel `=BORSAPI(...)` (`google-sheets-apps-script.js`)
För dig som vill bygga dina egna kalkylark från grunden med enskilda anpassade formler:
```excel
=BORSAPI("SE0000115446"; "revenue"; "2023")
=BORSAPI("VOLV-B"; "operating_income"; "2024-Q3")
```
Se källkoden i [google-sheets-apps-script.js](google-sheets-apps-script.js).
