/**
 * ============================================================================
 * BörsAPI - Komplett Aktieanalysmall för Google Sheets
 * Webbplats: https://borsapi.se | Docs: https://borsapi.se/docs
 * ============================================================================
 * 
 * FUNKTIONER:
 * 1. Automatisk skapande & layout av analysflikar ("Classic Finance"-stil).
 * 2. Hämtar historisk data för vald ticker:
 *    - Översikt med nyckeltal, multiplar (P/E, EV/EBIT, P/S etc.) och kalender
 *    - Inbyggd förenklad DCF-modell (kassaflödesvärdering)
 *    - Komplett Helårsdata (5-10 år) för RR, BR och KA
 *    - Kvartalsdata och rullande 12 månader (TTM)
 *    - Insynsstatistik och senaste insynstransaktioner (0 kvotförbrukning)
 *    - Betydande blankningspositioner (0 kvotförbrukning)
 *    - Kommande rapportdatum och bolagshändelser
 * 3. Enkla Google Sheets-formler (=BORSAPI(...)) för fri användning.
 * 
 * INSTALLATION:
 * 1. Skapa ett nytt tomt kalkylark på Google Sheets (sheets.new).
 * 2. Klicka på "Tillägg" (Extensions) -> "Apps Script".
 * 3. Ersätt all befintlig kod med hela detta skript.
 * 4. Klicka på Spara (diskett-ikonen).
 * 5. Ladda om Google Sheets-fliken i webbläsaren.
 * 6. En ny meny "BörsAPI" dyker nu upp i menyraden!
 * 7. Klicka på "BörsAPI" -> "⚙️ 2. Ange API-nyckel" (från https://borsapi.se/dashboard).
 * 8. Klicka på "BörsAPI" -> "🚀 1. Skapa / Återställ kalkylarkets flikar".
 * 9. Skriv in önskad ticker (t.ex. VOLV-B, EVO, ATCO-A) i cell B3 och klicka "Hämta data"!
 */

const DEFAULT_API_URL = "https://borsapi.se";

// ============================================================================
// 1. ANPASSAD MENY
// ============================================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("📊 BörsAPI")
    .addItem("🔄 Hämta data för vald aktie", "fetchStockData")
    .addSeparator()
    .addItem("🚀 1. Skapa / Återställ kalkylarkets flikar", "setupSheetLayout")
    .addItem("⚙️ 2. Ange API-nyckel", "promptApiKey")
    .addToUi();
}

// ============================================================================
// 2. HANTERING AV API-NYCKEL & INSTÄLLNINGAR
// ============================================================================
function getApiKey() {
  // 1. Kolla Script Properties
  const props = PropertiesService.getUserProperties();
  let key = props.getProperty("BORSAPI_KEY");
  if (key && key.trim() !== "") return key.trim();

  // 2. Kolla fliken "Inställningar" i cell B2
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName("Inställningar");
  if (settingsSheet) {
    const val = settingsSheet.getRange("B2").getValue();
    if (val && typeof val === "string" && val.trim().startsWith("fd_")) {
      return val.trim();
    }
  }

  return null;
}

function promptApiKey() {
  const ui = SpreadsheetApp.getUi();
  const currentKey = getApiKey() || "";
  const result = ui.prompt(
    "BörsAPI - Ange API-nyckel",
    "Klistra in din personliga API-nyckel från https://borsapi.se/dashboard (börjar med 'fd_'):\nNuvarande: " + (currentKey ? currentKey.substring(0, 8) + "..." : "Ingen"),
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    const newKey = result.getResponseText().trim();
    if (newKey) {
      PropertiesService.getUserProperties().setProperty("BORSAPI_KEY", newKey);
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const settingsSheet = ss.getSheetByName("Inställningar");
      if (settingsSheet) {
        settingsSheet.getRange("B2").setValue(newKey);
      }
      ui.alert("✅ API-nyckel sparad!", "Nyckeln har sparats. Du kan nu hämta bolagsdata.", ui.ButtonSet.OK);
    }
  }
}

// ============================================================================
// 3. SKAPA FLIKAR & VISUELL LAYOUT ("CLASSIC FINANCE")
// ============================================================================
function setupSheetLayout() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Skapa / Hämta flikar
  const sheets = {
    overview: getOrCreateSheet(ss, "Översikt & Värdering"),
    fy: getOrCreateSheet(ss, "Helår (FY)"),
    quarter: getOrCreateSheet(ss, "Kvartal & TTM"),
    insider: getOrCreateSheet(ss, "Insyn & Blankning"),
    settings: getOrCreateSheet(ss, "Inställningar")
  };

  // 2. Bygg fliken: Inställningar
  setupSettingsSheet(sheets.settings);

  // 3. Bygg fliken: Översikt & Värdering
  setupOverviewSheet(sheets.overview);

  // 4. Bygg fliken: Helår (FY)
  setupFySheet(sheets.fy);

  // 5. Bygg fliken: Kvartal & TTM
  setupQuarterSheet(sheets.quarter);

  // 6. Bygg fliken: Insyn & Blankning
  setupInsiderSheet(sheets.insider);

  ss.setActiveSheet(sheets.overview);
  SpreadsheetApp.getUi().alert(
    "🎉 Kalkylarkets mall är redo!",
    "Alla flikar och formler har skapats i Classic Finance-design.\n\n" +
    "1. Se till att du angett din API-nyckel i menyn 'BörsAPI' -> '⚙️ 2. Ange API-nyckel'.\n" +
    "2. Skriv in önskad Ticker (t.ex. VOLV-B) i cell B3 på 'Översikt & Värdering'.\n" +
    "3. Kör 'BörsAPI' -> '🔄 Hämta data för vald aktie'.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// --- Flik 1: Inställningar ---
function setupSettingsSheet(sheet) {
  sheet.clear();
  sheet.setTabColor("#64748b");
  
  sheet.getRange("A1:C1").merge().setValue("⚙️ BörsAPI - Inställningar & Konfiguration")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12);

  const rows = [
    ["API-nyckel:", getApiKey() || "fd_din_api_nyckel_har", "Hämta på https://borsapi.se/dashboard"],
    ["API Bas-URL:", DEFAULT_API_URL, "Standard: https://borsapi.se"],
    ["Redovisningsenhet:", "CONSOLIDATED", "CONSOLIDATED (standard) eller PARENT"]
  ];

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  sheet.getRange("A2:A4").setFontWeight("bold");
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 300);
}

// --- Flik 2: Översikt & Värdering ---
function setupOverviewSheet(sheet) {
  sheet.clear();
  sheet.setTabColor("#059669");

  // Header Banner
  sheet.getRange("A1:K1").merge().setValue("BÖRSAPI - AKTIEANALYS & VÄRDERINGSÖVERSIKT")
    .setBackground("#0f172a").setFontColor("#f8fafc").setFontWeight("bold").setFontSize(13)
    .setHorizontalAlignment("center");

  // Bolagsinfo & Inmatning
  const companyMeta = [
    ["Aktieticker:", "VOLV-B", "", "Aktiekurs (SEK):", "=IFERROR(GOOGLEFINANCE(\"STO:\"&B3); 285)", "", "Senast uppdaterad:", ""],
    ["Bolagsnamn:", "Volvo AB", "", "Antal aktier (m):", "='Helår (FY)'!B28", "", "Valuta:", "SEK"],
    ["ISIN:", "SE0000115446", "", "Börsvärde (Mkr):", "=E3*E4", "", "Sektor:", "Industri"],
    ["Lista / Marknad:", "Nasdaq Stockholm (Large Cap)", "", "Nettoskuld (Mkr):", "='Helår (FY)'!B47", "", "Enterprise Value (EV):", "=E5+E6"]
  ];
  sheet.getRange(3, 1, 4, 8).setValues(companyMeta);
  sheet.getRange("A3:A6").setFontWeight("bold").setBackground("#f1f5f9");
  sheet.getRange("D3:D6").setFontWeight("bold").setBackground("#f1f5f9");
  sheet.getRange("G3:G6").setFontWeight("bold").setBackground("#f1f5f9");

  // Markera ticker & aktiekurs som inmatningsfält med mjuk grön bakgrund
  sheet.getRange("B3").setBackground("#dcfce7").setFontWeight("bold").setFontSize(11);
  sheet.getRange("E3").setBackground("#dcfce7").setFontWeight("bold").setFontSize(11);

  // Värderingsmultiplar Sektion
  sheet.getRange("A8:E8").merge().setValue("📊 VÄRDERINGSMULTIPLAR")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10);

  const multiples = [
    ["Nyckeltal / Multipel", "Bas", "Senaste Helår (FY)", "Rullande 12m (TTM)", "Formelbeskrivning"],
    ["P/E (Price / Earnings)", "Aktiekurs / Vinst per aktie", "=IFERROR(E3/'Helår (FY)'!B29; \"-\")", "=IFERROR(E3/'Kvartal & TTM'!B23; \"-\")", "Börsvärde dividerat med årets nettoresultat"],
    ["EV/EBIT", "Enterprise Value / Rörelseresultat", "=IFERROR(E6/'Helår (FY)'!B21; \"-\")", "=IFERROR(E6/'Kvartal & TTM'!B16; \"-\")", "Företagsvärde dividerat med rörelseresultat"],
    ["EV/EBITDA", "Enterprise Value / EBITDA", "=IFERROR(E6/'Helår (FY)'!B19; \"-\")", "=IFERROR(E6/'Kvartal & TTM'!B14; \"-\")", "Företagsvärde dividerat med EBITDA"],
    ["P/S (Price / Sales)", "Börsvärde / Omsättning", "=IFERROR(E5/'Helår (FY)'!B11; \"-\")", "=IFERROR(E5/'Kvartal & TTM'!B9; \"-\")", "Börsvärde dividerat med nettoomsättning"],
    ["P/B (Price / Book)", "Börsvärde / Eget kapital", "=IFERROR(E5/'Helår (FY)'!B45; \"-\")", "=IFERROR(E5/'Helår (FY)'!B45; \"-\")", "Börsvärde dividerat med eget kapital"],
    ["EV/FCF", "Enterprise Value / Fritt kassaflöde", "=IFERROR(E6/'Helår (FY)'!B54; \"-\")", "=IFERROR(E6/'Kvartal & TTM'!B26; \"-\")", "Företagsvärde dividerat med fritt kassaflöde"],
    ["Direktavkastning (%)", "Utdelning per aktie / Aktiekurs", "=IFERROR(ABS('Helår (FY)'!B56)/E5; 0)", "-", "Senaste årsutdelning ställt mot börsvärde"],
    ["Nettoskuld / EBITDA", "Nettoskuld / EBITDA", "=IFERROR(E6/'Helår (FY)'!B19; \"-\")", "=IFERROR(E6/'Kvartal & TTM'!B14; \"-\")", "Finansiell skuldsättningsgrad"]
  ];
  sheet.getRange(9, 1, multiples.length, 5).setValues(multiples);
  sheet.getRange("A9:E9").setFontWeight("bold").setBackground("#e2e8f0");
  sheet.getRange("C10:D17").setNumberFormat("0.0x");
  sheet.getRange("C16").setNumberFormat("0.0%");

  // Lönsamhet & Marginaler Sektion
  sheet.getRange("G8:K8").merge().setValue("📈 LÖNSAMHET & NYCKELTAL")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10);

  const margins = [
    ["Marginal / Mått", "Senaste Helår (FY)", "Rullande 12m (TTM)", "3-års Snitt (FY)", "Beskrivning"],
    ["Omsättningstillväxt (%)", "='Helår (FY)'!B12", "='Kvartal & TTM'!B10", "=AVERAGE('Helår (FY)'!B12:D12)", "Årlig tillväxttakt"],
    ["Bruttomarginal (%)", "='Helår (FY)'!B15", "='Kvartal & TTM'!B13", "=AVERAGE('Helår (FY)'!B15:D15)", "Bruttoresultat / Omsättning"],
    ["EBITDA-marginal (%)", "=IFERROR('Helår (FY)'!B19/'Helår (FY)'!B11; 0)", "=IFERROR('Kvartal & TTM'!B14/'Kvartal & TTM'!B9; 0)", "=AVERAGE('Helår (FY)'!B19:D19)/AVERAGE('Helår (FY)'!B11:D11)", "EBITDA / Omsättning"],
    ["Rörelsemarginal / EBIT (%)", "='Helår (FY)'!B22", "='Kvartal & TTM'!B17", "=AVERAGE('Helår (FY)'!B22:D22)", "Rörelseresultat / Omsättning"],
    ["Nettomarginal (%)", "='Helår (FY)'!B27", "='Kvartal & TTM'!B22", "=AVERAGE('Helår (FY)'!B27:D27)", "Nettoresultat / Omsättning"],
    ["Fritt kassaflödesmarginal (%)", "=IFERROR('Helår (FY)'!B54/'Helår (FY)'!B11; 0)", "=IFERROR('Kvartal & TTM'!B26/'Kvartal & TTM'!B9; 0)", "=AVERAGE('Helår (FY)'!B54:D54)/AVERAGE('Helår (FY)'!B11:D11)", "Fritt Kassaflöde / Omsättning"],
    ["Soliditet (%)", "='Helår (FY)'!B48", "='Helår (FY)'!B48", "=AVERAGE('Helår (FY)'!B48:D48)", "Eget kapital / Totala tillgångar"],
    ["Avkastning på Eget Kapital (ROE)", "=IFERROR('Helår (FY)'!B26/'Helår (FY)'!B45; 0)", "=IFERROR('Kvartal & TTM'!B21/'Helår (FY)'!B45; 0)", "=AVERAGE('Helår (FY)'!B26:D26)/AVERAGE('Helår (FY)'!B45:D45)", "Nettoresultat / Eget kapital"]
  ];
  sheet.getRange(9, 7, margins.length, 5).setValues(margins);
  sheet.getRange("G9:K9").setFontWeight("bold").setBackground("#e2e8f0");
  sheet.getRange("H10:J17").setNumberFormat("0.0%");

  // Förenklad DCF-modell
  sheet.getRange("A20:E20").merge().setValue("💰 FÖRENKLAD DCF-VÄRDERINGSMODELL (KASSAFLÖDESMODELL)")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10);

  const dcfRows = [
    ["Antagande / Parameter", "Värde", "", "Resultat / Värdering", "Värde (SEK/Mkr)"],
    ["Basår Fritt Kassaflöde (FCF Mkr):", "=MAX(0; 'Helår (FY)'!B54)", "", "Nuvärde FCF år 1-5:", "=B27*(1-(1+B24)^-5)/B24"],
    ["FCF Tillväxttakt år 1-5 (%):", 0.06, "", "Terminalvärde (År 5 FCF):", "=(B27*(1+B22)^5*(1+B23))/(B24-B23)"],
    ["Evig tillväxttakt (%):", 0.02, "", "Nuvärde Terminalvärde:", "=E23/(1+B24)^5"],
    ["Diskonteringsränta / WACC (%):", 0.09, "", "Totalt Företagsvärde (EV):", "=E22+E24"],
    ["Utestående aktier (miljoner):", "=E4", "", "Minus Nettoskuld:", "=E6"],
    ["Nettoskuld (Mkr):", "=E6", "", "Motiverat Eget Kapital:", "=E25-E26"],
    ["Normaliserat FCF (Mkr):", "=AVERAGE('Helår (FY)'!B54:C54)", "", "Motiverat värde per aktie (SEK):", "=E27/B25"],
    ["", "", "", "Upp- / Nedsida mot aktuell kurs:", "=(E28-E3)/E3"]
  ];
  sheet.getRange(21, 1, dcfRows.length, 5).setValues(dcfRows);
  sheet.getRange("A21:E21").setFontWeight("bold").setBackground("#e2e8f0");
  sheet.getRange("B22:B24").setNumberFormat("0.0%").setBackground("#fef9c3");
  sheet.getRange("E28").setNumberFormat("0.00 kr").setFontWeight("bold").setBackground("#dcfce7");
  sheet.getRange("E29").setNumberFormat("+0.0%;-0.0%;0.0%").setFontWeight("bold");

  // Rapportkalender & Insyn/Blankning Sammanfattning
  sheet.getRange("G20:K20").merge().setValue("📅 RAPPORTKALENDER, INSYN & BLANKNING")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10);

  const eventsMeta = [
    ["Kategori", "Uppgift", "Detalj / Värde", "", ""],
    ["Nästa Rapport:", "-", "-", "", ""],
    ["Typ av rapport:", "-", "-", "", ""],
    ["Utdelningsdatum:", "-", "-", "", ""],
    ["Insynsköp senaste 90 dagar:", "='Insyn & Blankning'!C8", "Nettobelopp i kr", "", ""],
    ["VD-köp senaste 365 dagar:", "='Insyn & Blankning'!E9", "Nettobelopp i kr", "", ""],
    ["Total Blankningsgrad (%):", "='Insyn & Blankning'!B3", "Offentliga positioner >= 0,5%", "", ""]
  ];
  sheet.getRange(21, 7, eventsMeta.length, 5).setValues(eventsMeta);
  sheet.getRange("G21:K21").setFontWeight("bold").setBackground("#e2e8f0");

  // Kolumnbredder
  sheet.setColumnWidth(1, 210);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 20);
  sheet.setColumnWidth(7, 190);
  sheet.setColumnWidth(8, 130);
  sheet.setColumnWidth(9, 130);
  sheet.setColumnWidth(10, 140);
  sheet.setColumnWidth(11, 140);
}

// --- Flik 3: Helår (FY) ---
function setupFySheet(sheet) {
  sheet.clear();
  sheet.setTabColor("#2563eb");

  sheet.getRange("A1:K1").merge().setValue("HELÅRSRAPPORTER (FY) - RESULTATRÄKNING, BALANSRÄKNING & KASSAFLÖDE (Mkr)")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12);

  const lineItems = [
    // Header
    ["Rapportpost / Period", "2024", "2023", "2022", "2021", "2020", "2019"],
    
    // RESULTATRÄKNING
    ["=== RESULTATRÄKNING ===", "", "", "", "", "", ""],
    ["Nettoomsättning", 0, 0, 0, 0, 0, 0],
    ["  Omsättningstillväxt (%)", "=IFERROR((B11-C11)/ABS(C11); 0)", "=IFERROR((C11-D11)/ABS(D11); 0)", "=IFERROR((D11-E11)/ABS(E11); 0)", "=IFERROR((E11-F11)/ABS(F11); 0)", "=IFERROR((F11-G11)/ABS(G11); 0)", "-"],
    ["Kostnad för sålda varor (COGS)", 0, 0, 0, 0, 0, 0],
    ["Bruttoresultat", "=B11+B13", "=C11+C13", "=D11+D13", "=E11+E13", "=F11+F13", "=G11+G13"],
    ["  Bruttomarginal (%)", "=IFERROR(B14/B11; 0)", "=IFERROR(C14/C11; 0)", "=IFERROR(D14/D11; 0)", "=IFERROR(E14/E11; 0)", "=IFERROR(F14/F11; 0)", "=IFERROR(G14/G11; 0)"],
    ["Försäljningskostnader", 0, 0, 0, 0, 0, 0],
    ["Administrationskostnader", 0, 0, 0, 0, 0, 0],
    ["Forsknings- och utvecklingskostnader (FoU)", 0, 0, 0, 0, 0, 0],
    ["EBITDA", 0, 0, 0, 0, 0, 0],
    ["Av- och nedskrivningar", 0, 0, 0, 0, 0, 0],
    ["Rörelseresultat (EBIT)", 0, 0, 0, 0, 0, 0],
    ["  Rörelsemarginal (EBIT %)", "=IFERROR(B21/B11; 0)", "=IFERROR(C21/C11; 0)", "=IFERROR(D21/D11; 0)", "=IFERROR(E21/E11; 0)", "=IFERROR(F21/F11; 0)", "=IFERROR(G21/G11; 0)"],
    ["Finansnetto", 0, 0, 0, 0, 0, 0],
    ["Resultat före skatt", "=B21+B23", "=C21+C23", "=D21+D23", "=E21+E23", "=F21+F23", "=G21+G23"],
    ["Skatt", 0, 0, 0, 0, 0, 0],
    ["Årets Nettoresultat", 0, 0, 0, 0, 0, 0],
    ["  Nettomarginal (%)", "=IFERROR(B26/B11; 0)", "=IFERROR(C26/C11; 0)", "=IFERROR(D26/D11; 0)", "=IFERROR(E26/E11; 0)", "=IFERROR(F26/F11; 0)", "=IFERROR(G26/G11; 0)"],
    ["Antal utestående aktier (m)", 0, 0, 0, 0, 0, 0],
    ["Resultat per aktie (EPS)", "=IFERROR(B26/B28; 0)", "=IFERROR(C26/C28; 0)", "=IFERROR(D26/D28; 0)", "=IFERROR(E26/E28; 0)", "=IFERROR(F26/F28; 0)", "=IFERROR(G26/G28; 0)"],

    // BALANSRÄKNING
    ["=== BALANSRÄKNING ===", "", "", "", "", "", ""],
    ["Kassa och bank", 0, 0, 0, 0, 0, 0],
    ["Kundfordringar", 0, 0, 0, 0, 0, 0],
    ["Varulager", 0, 0, 0, 0, 0, 0],
    ["Summa omsättningstillgångar", 0, 0, 0, 0, 0, 0],
    ["Materiella anläggningstillgångar", 0, 0, 0, 0, 0, 0],
    ["Immateriella anläggningstillgångar & Goodwill", 0, 0, 0, 0, 0, 0],
    ["Summa anläggningstillgångar", 0, 0, 0, 0, 0, 0],
    ["SUMMA TILLGÅNGAR", 0, 0, 0, 0, 0, 0],
    ["Leverantörsskulder", 0, 0, 0, 0, 0, 0],
    ["Kortfristiga räntebärande skulder", 0, 0, 0, 0, 0, 0],
    ["Summa kortfristiga skulder", 0, 0, 0, 0, 0, 0],
    ["Långfristiga räntebärande skulder", 0, 0, 0, 0, 0, 0],
    ["Summa långfristiga skulder", 0, 0, 0, 0, 0, 0],
    ["SUMMA SKULDER", 0, 0, 0, 0, 0, 0],
    ["SUMMA EGET KAPITAL", 0, 0, 0, 0, 0, 0],
    ["SUMMA EGET KAPITAL OCH SKULDER", "=B44+B45", "=C44+C45", "=D44+D45", "=E44+E45", "=F44+F45", "=G44+G45"],
    ["Nettoskuld (Räntebärande skulder - Kassa)", "=(B40+B42)-B31", "=(C40+C42)-C31", "=(D40+D42)-D31", "=(E40+E42)-E31", "=(F40+F42)-F31", "=(G40+G42)-G31"],
    ["Soliditet (%)", "=IFERROR(B45/B38; 0)", "=IFERROR(C45/C38; 0)", "=IFERROR(D45/D38; 0)", "=IFERROR(E45/E38; 0)", "=IFERROR(F45/F38; 0)", "=IFERROR(G45/G38; 0)"],

    // KASSAFLÖDESANALYS
    ["=== KASSAFLÖDESANALYS ===", "", "", "", "", "", ""],
    ["Kassaflöde löpande verksamheten", 0, 0, 0, 0, 0, 0],
    ["Förändring rörelsekapital", 0, 0, 0, 0, 0, 0],
    ["Investeringar materiella tillgångar (Capex)", 0, 0, 0, 0, 0, 0],
    ["Försäljning anläggningstillgångar", 0, 0, 0, 0, 0, 0],
    ["FRITT KASSAFLÖDE (FCF)", 0, 0, 0, 0, 0, 0],
    ["Finansieringsverksamhetens kassaflöde", 0, 0, 0, 0, 0, 0],
    ["Utbetald utdelning", 0, 0, 0, 0, 0, 0],
    ["ÅRETS NETTOKASSAFLÖDE", 0, 0, 0, 0, 0, 0]
  ];

  sheet.getRange(9, 1, lineItems.length, 7).setValues(lineItems);
  sheet.getRange("A9:G9").setFontWeight("bold").setBackground("#e2e8f0");
  sheet.getRange("A10:G10").setFontWeight("bold").setBackground("#cbd5e1");
  sheet.getRange("A30:G30").setFontWeight("bold").setBackground("#cbd5e1");
  sheet.getRange("A49:G49").setFontWeight("bold").setBackground("#cbd5e1");

  // Markera rader med fetstil
  sheet.getRange("A14:G14").setFontWeight("bold");
  sheet.getRange("A21:G21").setFontWeight("bold");
  sheet.getRange("A26:G26").setFontWeight("bold");
  sheet.getRange("A38:G38").setFontWeight("bold");
  sheet.getRange("A44:G46").setFontWeight("bold");
  sheet.getRange("A54:G54").setFontWeight("bold");
  sheet.getRange("A57:G57").setFontWeight("bold");

  // Procentformatering
  sheet.getRange("B12:G12").setNumberFormat("+0.0%;-0.0%;0.0%");
  sheet.getRange("B15:G15").setNumberFormat("0.0%");
  sheet.getRange("B22:G22").setNumberFormat("0.0%");
  sheet.getRange("B27:G27").setNumberFormat("0.0%");
  sheet.getRange("B48:G48").setNumberFormat("0.0%");

  sheet.setColumnWidth(1, 280);
  for (let c = 2; c <= 7; c++) sheet.setColumnWidth(c, 110);
}

// --- Flik 4: Kvartal & TTM ---
function setupQuarterSheet(sheet) {
  sheet.clear();
  sheet.setTabColor("#7c3aed");

  sheet.getRange("A1:I1").merge().setValue("KVARTALSRAPPORTER & TTM (RULLANDE 12 MÅNADER)")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12);

  const qItems = [
    ["Rapportpost / Period", "Senaste TTM", "Q4", "Q3", "Q2", "Q1", "Q4 (-1)", "Q3 (-1)", "Q2 (-1)"],
    ["Nettoomsättning", 0, 0, 0, 0, 0, 0, 0, 0],
    ["  Tillväxt YoY (%)", "=IFERROR((C10-G10)/ABS(G10); 0)", "=IFERROR((C10-G10)/ABS(G10); 0)", "=IFERROR((D10-H10)/ABS(H10); 0)", "=IFERROR((E10-I10)/ABS(I10); 0)", "-", "-", "-", "-"],
    ["Kostnad sålda varor (COGS)", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Bruttoresultat", "=B10+B12", "=C10+C12", "=D10+D12", "=E10+E12", "=F10+F12", "=G10+G12", "=H10+H12", "=I10+I12"],
    ["  Bruttomarginal (%)", "=IFERROR(B13/B10; 0)", "=IFERROR(C13/C10; 0)", "=IFERROR(D13/D10; 0)", "=IFERROR(E13/E10; 0)", "=IFERROR(F13/F10; 0)", "=IFERROR(G13/G10; 0)", "=IFERROR(H13/H10; 0)", "=IFERROR(I13/I10; 0)"],
    ["EBITDA", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Av- och nedskrivningar", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Rörelseresultat (EBIT)", 0, 0, 0, 0, 0, 0, 0, 0],
    ["  Rörelsemarginal (%)", "=IFERROR(B17/B10; 0)", "=IFERROR(C17/C10; 0)", "=IFERROR(D17/D10; 0)", "=IFERROR(E17/E10; 0)", "=IFERROR(F17/F10; 0)", "=IFERROR(G17/G10; 0)", "=IFERROR(H17/H10; 0)", "=IFERROR(I17/I10; 0)"],
    ["Finansnetto", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Resultat före skatt", "=B17+B19", "=C17+C19", "=D17+D19", "=E17+E19", "=F17+F19", "=G17+G19", "=H17+H19", "=I17+I19"],
    ["Skatt", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Årets Nettoresultat", 0, 0, 0, 0, 0, 0, 0, 0],
    ["  Nettomarginal (%)", "=IFERROR(B22/B10; 0)", "=IFERROR(C22/C10; 0)", "=IFERROR(D22/D10; 0)", "=IFERROR(E22/E10; 0)", "=IFERROR(F22/F10; 0)", "=IFERROR(G22/G10; 0)", "=IFERROR(H22/H10; 0)", "=IFERROR(I22/I10; 0)"],
    ["Vinst per aktie (EPS)", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Kassaflöde löpande verksamhet", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Investeringar (Capex)", 0, 0, 0, 0, 0, 0, 0, 0],
    ["Fritt kassaflöde (FCF)", 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  sheet.getRange(8, 1, qItems.length, 9).setValues(qItems);
  sheet.getRange("A8:I8").setFontWeight("bold").setBackground("#e2e8f0");
  sheet.getRange("B8:B27").setBackground("#f5f3ff");

  sheet.getRange("B11:I11").setNumberFormat("+0.0%;-0.0%;0.0%");
  sheet.getRange("B14:I14").setNumberFormat("0.0%");
  sheet.getRange("B18:I18").setNumberFormat("0.0%");
  sheet.getRange("B23:I23").setNumberFormat("0.0%");

  sheet.setColumnWidth(1, 260);
  for (let c = 2; c <= 9; c++) sheet.setColumnWidth(c, 110);
}

// --- Flik 5: Insyn & Blankning ---
function setupInsiderSheet(sheet) {
  sheet.clear();
  sheet.setTabColor("#ea580c");

  sheet.getRange("A1:H1").merge().setValue("INSYNSHANDEL & BLANKNINGSPOSITIONER (FI-DATA VIA BÖRSAPI)")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12);

  // Blankning Sammanfattning
  sheet.getRange("A3:D3").setValues([["Total Offentlig Blankning (%):", 0, "Senast uppdaterad:", "-"]]);
  sheet.getRange("A3").setFontWeight("bold");
  sheet.getRange("B3").setNumberFormat("0.00%").setFontWeight("bold").setFontSize(12).setFontColor("#dc2626");

  // Insynsstatistik
  sheet.getRange("A5:D5").merge().setValue("👥 AGGREGERAD INSYNSSTATISTIK")
    .setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold");

  const statHeader = [
    ["Mätperiod", "Antal Köp", "Antal Sälj", "Nettoköp Belopp (SEK)", "Varav VD-nettoköp (SEK)"],
    ["Senaste 30 dagarna", 0, 0, 0, 0],
    ["Senaste 90 dagarna", 0, 0, 0, 0],
    ["Senaste 365 dagarna", 0, 0, 0, 0]
  ];
  sheet.getRange(6, 1, statHeader.length, 5).setValues(statHeader);
  sheet.getRange("A6:E6").setFontWeight("bold").setBackground("#e2e8f0");
  sheet.getRange("D7:E9").setNumberFormat("#,##0 kr");

  // Betydande blankningspositioner
  sheet.getRange("A11:E11").merge().setValue("📉 AKTIVA BLANKNINGSPOSITIONER (>= 0,5% AV KAPITAL)")
    .setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold");

  const shortHeader = [["Fond / Innehavare", "Position (%)", "Positionsdatum", "Status", "ISIN"]];
  sheet.getRange(12, 1, 1, 5).setValues(shortHeader);
  sheet.getRange("A12:E12").setFontWeight("bold").setBackground("#e2e8f0");

  // Senaste insynstransaktioner
  sheet.getRange("A19:G19").merge().setValue("🔍 SENASTE INSYNSTRANSAKTIONERNA")
    .setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold");

  const txHeader = [["Datum", "Person / Befattningshavare", "Befattning / Roll", "Transaktionstyp", "Antal aktier", "Pris (SEK)", "Totalt belopp (SEK)"]];
  sheet.getRange(20, 1, 1, 7).setValues(txHeader);
  sheet.getRange("A20:G20").setFontWeight("bold").setBackground("#e2e8f0");

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 110);
  sheet.setColumnWidth(7, 160);
}

// ============================================================================
// 4. HUVUDFUNKTION: HÄMTA ALL DATA FÖR AKTIE
// ============================================================================
function fetchStockData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const overviewSheet = ss.getSheetByName("Översikt & Värdering");
  const fySheet = ss.getSheetByName("Helår (FY)");
  const quarterSheet = ss.getSheetByName("Kvartal & TTM");
  const insiderSheet = ss.getSheetByName("Insyn & Blankning");

  if (!overviewSheet || !fySheet) {
    SpreadsheetApp.getUi().alert("Flikarna saknas! Kör först 'BörsAPI' -> '🚀 1. Skapa / Återställ kalkylarkets flikar'.");
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    promptApiKey();
    return;
  }

  // Läs ticker från B3
  let ticker = overviewSheet.getRange("B3").getValue();
  if (!ticker || typeof ticker !== "string" || ticker.trim() === "") {
    const input = SpreadsheetApp.getUi().prompt("Ange aktieticker (t.ex. VOLV-B, EVO, ATCO-A, INVE-B):");
    if (input.getSelectedButton() !== SpreadsheetApp.getUi().Button.OK) return;
    ticker = input.getResponseText().trim().toUpperCase();
    overviewSheet.getRange("B3").setValue(ticker);
  } else {
    ticker = ticker.trim().toUpperCase();
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Hämtar data för " + ticker + " från BörsAPI...", "BörsAPI", 10);

  try {
    // 1. Slå upp bolaget för att få UUID och ISIN
    const compUrl = DEFAULT_API_URL + "/api/v1/companies?ticker=" + encodeURIComponent(ticker);
    const compRes = apiFetch(compUrl, apiKey);
    if (!compRes.data || compRes.data.length === 0) {
      throw new Error("Hittade inget bolag med tickern '" + ticker + "'. Kontrollera stavning eller testa ISIN.");
    }
    const company = compRes.data[0];
    const companyId = company.id;

    // Uppdatera metadata på Översikt
    overviewSheet.getRange("B4").setValue(company.name);
    overviewSheet.getRange("B5").setValue(company.isin);
    overviewSheet.getRange("B6").setValue((company.market || "XSTO") + (company.sector ? " - " + company.sector : ""));
    overviewSheet.getRange("H3").setValue(Utilities.formatDate(new Date(), "Europe/Stockholm", "yyyy-MM-dd HH:mm"));
    overviewSheet.getRange("H5").setValue(company.sector || "-");

    // 2. Hämta Helårsrapporter (FY)
    const fyUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/reports?period_type=year&limit=10&order=desc";
    const fyRes = apiFetch(fyUrl, apiKey);
    const fyReports = consolidateReportsByPeriod(fyRes.data || []);

    // Fyll i Helår (FY)
    populateFySheet(fySheet, fyReports);

    // 3. Hämta Kvartalsrapporter (Q) och TTM
    const qUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/reports?period_type=quarter&limit=8&order=desc";
    const qRes = apiFetch(qUrl, apiKey);
    const qReports = consolidateReportsByPeriod(qRes.data || []);

    const ttmUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/reports?period_type=ttm&limit=1&order=desc";
    const ttmRes = apiFetch(ttmUrl, apiKey);
    const ttmReport = (ttmRes.data && ttmRes.data.length > 0) ? ttmRes.data[0] : null;

    populateQuarterSheet(quarterSheet, qReports, ttmReport);

    // 4. Hämta Insynsstatistik (0 kvotförbrukning)
    try {
      const insStatUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/insider-statistics";
      const insStatRes = apiFetch(insStatUrl, apiKey);
      if (insStatRes.statistics) {
        populateInsiderStats(insiderSheet, insStatRes.statistics);
      }
    } catch (e) {
      console.warn("Kunde inte hämta insynsstatistik:", e);
    }

    // 5. Hämta Insynstransaktioner (0 kvotförbrukning)
    try {
      const insTxUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/insider-transactions?limit=25";
      const insTxRes = apiFetch(insTxUrl, apiKey);
      populateInsiderTransactions(insiderSheet, insTxRes.data || []);
    } catch (e) {
      console.warn("Kunde inte hämta insynstransaktioner:", e);
    }

    // 6. Hämta Blankning (0 kvotförbrukning)
    try {
      const shortUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/short-positions";
      const shortRes = apiFetch(shortUrl, apiKey);
      populateShortPositions(insiderSheet, shortRes.data || []);
    } catch (e) {
      console.warn("Kunde inte hämta blankning:", e);
    }

    // 7. Hämta Kalender (0 kvotförbrukning)
    try {
      const calUrl = DEFAULT_API_URL + "/api/v1/companies/" + companyId + "/calendar?status=upcoming&limit=5&order=asc";
      const calRes = apiFetch(calUrl, apiKey);
      populateCalendarOverview(overviewSheet, calRes.data || []);
    } catch (e) {
      console.warn("Kunde inte hämta kalender:", e);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast("✅ Data framgångsrikt uppdaterad!", "Klart", 5);

  } catch (err) {
    SpreadsheetApp.getUi().alert("Fel vid hämtning: " + err.message);
  }
}

// ============================================================================
// 5. FYLL I DATA PÅ FLIKARNA
// ============================================================================

function populateFySheet(sheet, reports) {
  if (!reports || reports.length === 0) return;

  // Sortera fallande efter period (senaste året först: 2024, 2023, 2022...)
  const numYears = Math.min(reports.length, 6);
  const years = reports.slice(0, numYears);

  // Skriv årtal i rad 9
  for (let i = 0; i < numYears; i++) {
    sheet.getRange(9, 2 + i).setValue(years[i].period);
  }

  // Fyll i data för respektive rad
  for (let i = 0; i < numYears; i++) {
    const r = years[i];
    const col = 2 + i;

    // Resultaträkning
    setVal(sheet, 11, col, r.revenue);
    setVal(sheet, 13, col, r.cogs);
    setVal(sheet, 16, col, r.selling_expenses);
    setVal(sheet, 17, col, r.administrative_expenses);
    setVal(sheet, 18, col, r.rd_expenses);
    setVal(sheet, 19, col, r.ebitda);
    setVal(sheet, 20, col, r.depreciation_and_amortization);
    setVal(sheet, 21, col, r.operating_income);
    setVal(sheet, 23, col, r.financial_items);
    setVal(sheet, 25, col, r.tax);
    setVal(sheet, 26, col, r.net_income);
    setVal(sheet, 28, col, r.shares_outstanding ? (r.shares_outstanding / 1000000) : null);

    // Balansräkning
    setVal(sheet, 31, col, r.cash_and_equivalents);
    setVal(sheet, 32, col, r.accounts_receivable);
    setVal(sheet, 33, col, r.inventory);
    setVal(sheet, 34, col, r.total_current_assets);
    setVal(sheet, 35, col, r.property_plant_equipment);
    setVal(sheet, 36, col, (r.intangible_assets || 0) + (r.goodwill || 0));
    setVal(sheet, 37, col, r.total_non_current_assets);
    setVal(sheet, 38, col, r.total_assets);
    setVal(sheet, 39, col, r.accounts_payable);
    setVal(sheet, 40, col, r.short_term_debt);
    setVal(sheet, 41, col, r.total_current_liabilities);
    setVal(sheet, 42, col, r.long_term_debt);
    setVal(sheet, 43, col, r.total_non_current_liabilities);
    setVal(sheet, 44, col, r.total_liabilities);
    setVal(sheet, 45, col, r.total_equity);

    // Kassaflödesanalys
    setVal(sheet, 50, col, r.operating_cash_flow);
    setVal(sheet, 51, col, (r.change_in_inventory || 0) + (r.change_in_receivables || 0) + (r.change_in_payables || 0));
    setVal(sheet, 52, col, r.capex);
    setVal(sheet, 53, col, r.sale_of_assets);
    setVal(sheet, 54, col, r.free_cash_flow || (r.operating_cash_flow ? (r.operating_cash_flow + (r.capex || 0)) : null));
    setVal(sheet, 55, col, r.financing_cash_flow);
    setVal(sheet, 56, col, r.dividends_paid);
    setVal(sheet, 57, col, r.net_cash_flow);
  }
}

function populateQuarterSheet(sheet, qReports, ttmReport) {
  // 1. TTM Kolumn (Kolumn B)
  if (ttmReport) {
    sheet.getRange("B8").setValue(ttmReport.period || "Senaste TTM");
    setVal(sheet, 9, 2, ttmReport.revenue);
    setVal(sheet, 11, 2, ttmReport.cogs);
    setVal(sheet, 14, 2, ttmReport.ebitda);
    setVal(sheet, 15, 2, ttmReport.depreciation_and_amortization);
    setVal(sheet, 16, 2, ttmReport.operating_income);
    setVal(sheet, 18, 2, ttmReport.financial_items);
    setVal(sheet, 20, 2, ttmReport.tax);
    setVal(sheet, 21, 2, ttmReport.net_income);
    setVal(sheet, 23, 2, ttmReport.eps);
    setVal(sheet, 24, 2, ttmReport.operating_cash_flow);
    setVal(sheet, 25, 2, ttmReport.capex);
    setVal(sheet, 26, 2, ttmReport.free_cash_flow || (ttmReport.operating_cash_flow ? (ttmReport.operating_cash_flow + (ttmReport.capex || 0)) : null));
  }

  // 2. Kvartalskolumner (Kolumn C-I)
  if (qReports && qReports.length > 0) {
    const numQ = Math.min(qReports.length, 7);
    for (let i = 0; i < numQ; i++) {
      const q = qReports[i];
      const col = 3 + i;
      sheet.getRange(8, col).setValue(q.period);

      setVal(sheet, 9, col, q.revenue);
      setVal(sheet, 11, col, q.cogs);
      setVal(sheet, 14, col, q.ebitda);
      setVal(sheet, 15, col, q.depreciation_and_amortization);
      setVal(sheet, 16, col, q.operating_income);
      setVal(sheet, 18, col, q.financial_items);
      setVal(sheet, 20, col, q.tax);
      setVal(sheet, 21, col, q.net_income);
      setVal(sheet, 23, col, q.eps);
      setVal(sheet, 24, col, q.operating_cash_flow);
      setVal(sheet, 25, col, q.capex);
      setVal(sheet, 26, col, q.free_cash_flow || (q.operating_cash_flow ? (q.operating_cash_flow + (q.capex || 0)) : null));
    }
  }
}

function populateInsiderStats(sheet, stats) {
  if (stats["30d"]) {
    sheet.getRange(7, 2).setValue(stats["30d"].buy_count || 0);
    sheet.getRange(7, 3).setValue(stats["30d"].sell_count || 0);
    sheet.getRange(7, 4).setValue(stats["30d"].net_value_sek || 0);
    sheet.getRange(7, 5).setValue(stats["30d"].ceo_net_value_sek || 0);
  }
  if (stats["90d"]) {
    sheet.getRange(8, 2).setValue(stats["90d"].buy_count || 0);
    sheet.getRange(8, 3).setValue(stats["90d"].sell_count || 0);
    sheet.getRange(8, 4).setValue(stats["90d"].net_value_sek || 0);
    sheet.getRange(8, 5).setValue(stats["90d"].ceo_net_value_sek || 0);
  }
  if (stats["365d"]) {
    sheet.getRange(9, 2).setValue(stats["365d"].buy_count || 0);
    sheet.getRange(9, 3).setValue(stats["365d"].sell_count || 0);
    sheet.getRange(9, 4).setValue(stats["365d"].net_value_sek || 0);
    sheet.getRange(9, 5).setValue(stats["365d"].ceo_net_value_sek || 0);
  }
}

function populateShortPositions(sheet, positions) {
  // Rensa gamla rader
  sheet.getRange("A13:E18").clearContent();

  if (!positions || positions.length === 0) {
    sheet.getRange("B3").setValue(0);
    sheet.getRange("A13").setValue("Inga offentliga blankningspositioner (>= 0,5%) registrerade.");
    return;
  }

  // Beräkna total blankning
  let totalShort = 0;
  positions.forEach(p => {
    if (p.is_active) totalShort += Number(p.percentage || 0);
  });
  sheet.getRange("B3").setValue(totalShort / 100);
  sheet.getRange("D3").setValue(positions[0].position_date || "-");

  const rows = positions.slice(0, 6).map(p => [
    p.holder_name,
    p.percentage ? (p.percentage / 100) : 0,
    p.position_date,
    p.is_active ? "Aktiv" : "Stängd",
    p.isin
  ]);

  if (rows.length > 0) {
    sheet.getRange(13, 1, rows.length, 5).setValues(rows);
    sheet.getRange(13, 2, rows.length, 1).setNumberFormat("0.00%");
  }
}

function populateInsiderTransactions(sheet, txs) {
  sheet.getRange("A21:G35").clearContent();

  if (!txs || txs.length === 0) {
    sheet.getRange("A21").setValue("Inga registrerade insynstransaktioner.");
    return;
  }

  const rows = txs.slice(0, 15).map(t => [
    t.transaction_date,
    t.person_name,
    t.pdmr_role || "-",
    t.transaction_type,
    t.quantity || 0,
    t.price || 0,
    t.total_value || 0
  ]);

  sheet.getRange(21, 1, rows.length, 7).setValues(rows);
  sheet.getRange(21, 5, rows.length, 1).setNumberFormat("#,##0");
  sheet.getRange(21, 6, rows.length, 1).setNumberFormat("#,##0.00 kr");
  sheet.getRange(21, 7, rows.length, 1).setNumberFormat("#,##0 kr");
}

function populateCalendarOverview(overviewSheet, events) {
  if (!events || events.length === 0) return;

  const nextReport = events.find(e => e.event_type && (e.event_type.includes("REPORT") || e.event_type.includes("Q")));
  const nextDiv = events.find(e => e.event_type && e.event_type.includes("DIVIDEND"));

  if (nextReport) {
    overviewSheet.getRange("H22").setValue(nextReport.event_date || "-");
    overviewSheet.getRange("I22").setValue(nextReport.is_confirmed ? "Bekräftad" : "Preliminär");
    overviewSheet.getRange("H23").setValue(nextReport.period || nextReport.event_type);
  }

  if (nextDiv) {
    overviewSheet.getRange("H24").setValue(nextDiv.event_date || "-");
    overviewSheet.getRange("I24").setValue(nextDiv.extra_data ? JSON.stringify(nextDiv.extra_data) : "Utdelning");
  }
}

// Hjälpfunktion för att sätta värde om inte null
function setVal(sheet, row, col, val) {
  if (val !== undefined && val !== null) {
    sheet.getRange(row, col).setValue(val);
  }
}

// Konsolidera RR/BR/KA rader per period
function consolidateReportsByPeriod(rawReports) {
  const byPeriod = {};
  rawReports.forEach(r => {
    if (!byPeriod[r.period]) {
      byPeriod[r.period] = {};
    }
    Object.keys(r).forEach(k => {
      if (r[k] !== null && r[k] !== undefined && byPeriod[r.period][k] === undefined) {
        byPeriod[r.period][k] = r[k];
      }
    });
  });

  // Sortera fallande efter period (2024, 2023, ...)
  return Object.keys(byPeriod)
    .sort((a, b) => b.localeCompare(a))
    .map(p => byPeriod[p]);
}

// ============================================================================
// 6. API FETCH HJÄLPFUNKTION
// ============================================================================
function apiFetch(url, apiKey) {
  const options = {
    method: "get",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Accept": "application/json"
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code === 401) {
    throw new Error("Ogiltig API-nyckel. Kontrollera din nyckel från borsapi.se/dashboard.");
  } else if (code === 429) {
    throw new Error("Rate limit överskriden. Du har nått din gräns för API-anrop.");
  } else if (code !== 200) {
    try {
      const errJson = JSON.parse(text);
      throw new Error(errJson.error || ("HTTP fel " + code));
    } catch (e) {
      throw new Error("HTTP fel " + code + ": " + text.substring(0, 100));
    }
  }

  return JSON.parse(text);
}

// ============================================================================
// 7. ANPASSAD KALKYLARKFUNKTION (=BORSAPI) FÖR FRI ANVÄNDNING
// ============================================================================
/**
 * Hämtar ett specifikt finansiellt nyckeltal för en aktie direkt i en cell.
 * Exempel:
 *   =BORSAPI("VOLV-B"; "revenue"; "2023")
 *   =BORSAPI("SE0000115446"; "operating_income"; "2024-Q3")
 *   =BORSAPI("EVO"; "eps"; "latest")
 * 
 * @param {string} identifier Ticker (t.ex. "VOLV-B") eller ISIN (t.ex. "SE0000115446").
 * @param {string} field Fältet som ska hämtas (t.ex. "revenue", "operating_income", "net_income", "total_equity").
 * @param {string} period Period (t.ex. "2023", "2024-Q3", "2024-Q3 TTM").
 * @return {number|string} Det efterfrågade värdet.
 * @customfunction
 */
function BORSAPI(identifier, field, period) {
  if (!identifier || !field || !period) {
    return "Fel: Ange identifier, fält och period.";
  }

  const key = getApiKey();
  if (!key) return "Fel: API-nyckel saknas";

  try {
    const isinOrId = identifier.trim().toUpperCase();
    const url = DEFAULT_API_URL + "/api/v1/companies/" + encodeURIComponent(isinOrId) + "/reports/" + encodeURIComponent(period);
    const res = apiFetch(url, key);

    if (field.indexOf(".") !== -1) {
      const parts = field.split(".");
      let current = res;
      for (let i = 0; i < parts.length; i++) {
        if (current == null) return null;
        current = current[parts[i]];
      }
      return current;
    }

    return res[field] !== undefined ? res[field] : "Fält saknas";
  } catch (e) {
    return "Fel: " + e.message;
  }
}
