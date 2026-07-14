/**
 * Hämta finansiell data från BörsAPI direkt i Google Sheets.
 * 
 * Installera:
 * 1. Öppna ditt kalkylark i Google Sheets.
 * 2. Klicka på Tillägg (Extensions) -> Apps Script.
 * 3. Ta bort eventuell kod och klistra in detta skript.
 * 4. Ersätt "DIN_API_NYCKEL" nedan med din faktiska nyckel från https://borsapi.se/dashboard
 * 5. Klicka på spara (diskett-ikonen).
 * 
 * Användning i kalkylark:
 * =BORSAPI("SE0011166610"; "revenue"; "2023")
 * =BORSAPI("SE0011166610"; "operating_income"; "2024-Q3")
 */

const BORSAPI_KEY = "DIN_API_NYCKEL"; // Byt ut mot din API-nyckel från borsapi.se

/**
 * Hämtar ett specifikt finansiellt värde för ett bolag från BörsAPI.
 * 
 * @param {string} isin Bolagets ISIN-kod (t.ex. "SE0011166610" för Atlas Copco A).
 * @param {string} field Det finansiella fältet (t.ex. "revenue", "operating_income", "net_income", "total_assets", "net_debt").
 * @param {string} period Perioden som ska hämtas (t.ex. "2023", "2024-Q3" eller "2024-Q3 TTM").
 * @param {string} entityType Valfritt: "CONSOLIDATED" (standard) eller "PARENT" (moderbolag).
 * @return {number|string} Det efterfrågade värdet eller ett felmeddelande.
 * @customfunction
 */
function BORSAPI(isin, field, period, entityType) {
  if (!isin || !field || !period) {
    return "Fel: ISIN, fält och period måste anges.";
  }
  
  if (BORSAPI_KEY === "DIN_API_NYCKEL") {
    return "Fel: Ange din API-nyckel i Apps Script-koden.";
  }

  const entity = entityType || "CONSOLIDATED";
  const url = "https://borsapi.se/api/v1/companies/" + isin + "/reports/" + encodeURIComponent(period) + "?entity_type=" + entity;

  try {
    const response = UrlFetchApp.fetch(url, {
      headers: {
        "Authorization": "Bearer " + BORSAPI_KEY,
        "Accept": "application/json"
      },
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      try {
        const errorData = JSON.parse(responseText);
        return "Fel (" + responseCode + "): " + (errorData.error || "Okänt fel");
      } catch (e) {
        return "Fel (" + responseCode + "): Misslyckades att hämta data";
      }
    }

    const data = JSON.parse(responseText);
    
    // Hantera nästlade objekt (t.ex. data.company.name)
    if (field.indexOf(".") !== -1) {
      const parts = field.split(".");
      let current = data;
      for (let i = 0; i < parts.length; i++) {
        if (current == null) return null;
        current = current[parts[i]];
      }
      return current;
    }

    return data[field] !== undefined ? data[field] : "Fält saknas";

  } catch (err) {
    return "Anslutningsfel: " + err.toString();
  }
}
