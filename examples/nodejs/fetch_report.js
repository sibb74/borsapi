#!/usr/bin/env node
/**
 * Exempel på hur du hämtar finansiella rapporter från BörsAPI med Node.js (fetch).
 * 
 * Användning:
 *   node fetch_report.js
 */

const API_KEY = process.env.BORSAPI_API_KEY || "DIN_API_NYCKEL";

// Volvo B (ISIN: SE0000115446)
const COMPANY_ISIN = "SE0000115446";
const PERIOD = "2023";

async function fetchFinancialReport(isin, period) {
  if (API_KEY === "DIN_API_NYCKEL") {
    console.error("[-] Fel: Du måste ange en giltig API-nyckel. Hämta en på https://borsapi.se");
    return;
  }

  const url = `https://borsapi.se/api/v1/companies/${isin}/reports/${encodeURIComponent(period)}`;
  const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "Accept": "application/json",
    "User-Agent": "borsapi-nodejs-example/1.0.0"
  };

  console.log(`[+] Hämtar rapport för ${isin} (Period: ${period})...`);

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[-] Fel ${response.status}: ${errorText}`);
      return;
    }

    const data = await response.json();
    const company = data.company || {};

    console.log("\n" + "=".repeat(50));
    console.log(`FINANSIELL RAPPORT FÖR: ${company.name || "Okänt bolag"} (${company.ticker || ""})`);
    console.log(`Period: ${data.period} | Typ: ${data.period_type} | Valuta: ${data.currency || "SEK"}`);
    console.log("=".repeat(50));

    const fmt = (val) => {
      if (val === undefined || val === null) return "N/A";
      return new Intl.NumberFormat("sv-SE").format(val);
    };

    console.log(`Omsättning (Revenue):             ${fmt(data.revenue)}`);
    console.log(`Bruttovinst (Gross Profit):       ${fmt(data.gross_profit)}`);
    console.log(`Rörelseresultat (EBIT):           ${fmt(data.operating_income)}`);
    console.log(`Finansnetto (Financial Items):    ${fmt(data.financial_items)}`);
    console.log(`Resultat före skatt (EBT):        ${fmt(data.pre_tax_income)}`);
    console.log(`Nettoresultat (Net Income):       ${fmt(data.net_income)}`);
    console.log("-".repeat(50));
    console.log(`Totala tillgångar (Assets):       ${fmt(data.total_assets)}`);
    console.log(`Eget kapital (Equity):            ${fmt(data.total_equity)}`);
    console.log(`Totala skulder (Liabilities):     ${fmt(data.total_liabilities)}`);
    console.log("-".repeat(50));
    console.log(`Operativt kassaflöde (OCF):       ${fmt(data.cash_flow_from_operating_activities)}`);
    console.log(`Investeringskassaflöde (CapEx):   ${fmt(data.cash_flow_from_investing_activities)}`);
    console.log(`Finansieringskassaflöde (FinEx):  ${fmt(data.cash_flow_from_financing_activities)}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("[-] Anslutningsfel:", error.message);
  }
}

fetchFinancialReport(COMPANY_ISIN, PERIOD);
