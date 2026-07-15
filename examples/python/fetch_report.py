#!/usr/bin/env python3
"""
Exempel på hur du hämtar finansiella rapporter från BörsAPI med Python.

Krav:
  pip install requests

Användning:
  python fetch_report.py
"""

import os
import requests

# Hämta API-nyckel från miljövariabel eller ange direkt här
API_KEY = os.environ.get("BORSAPI_API_KEY", "DIN_API_NYCKEL")

# Volvo B (ISIN: SE0000115446)
COMPANY_ISIN = "SE0000115446"
PERIOD = "2023"

def fetch_financial_report(isin, period):
    if API_KEY == "DIN_API_NYCKEL":
        print("[-] Fel: Du måste ange en giltig API-nyckel. Hämta en på https://borsapi.se")
        return

    url = f"https://borsapi.se/api/v1/companies/{isin}/reports/{period}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }

    print(f"[+] Hämtar rapport för {isin} (Period: {period})...")
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        print(f"[-] Fel {response.status_code}: {response.text}")
        return

    data = response.json()
    
    company_name = data.get("company", {}).get("name", "Okänt bolag")
    ticker = data.get("company", {}).get("ticker", "")
    
    print("\n" + "=" * 50)
    print(f"FINANSIELL RAPPORT FOR: {company_name} ({ticker})")
    print(f"Period: {data.get('period')} | Typ: {data.get('period_type')} | Valuta: {data.get('currency', 'SEK')}")
    print("=" * 50)
    
    # Formatering av belopp
    def fmt(val):
        if val is None:
            return "N/A"
        return f"{val:,.0f}".replace(",", " ")

    print(f"Omsättning (Revenue):             {fmt(data.get('revenue'))}")
    print(f"Bruttovinst (Gross Profit):       {fmt(data.get('gross_profit'))}")
    print(f"Rörelseresultat (EBIT):           {fmt(data.get('operating_income'))}")
    print(f"Finansnetto (Financial Items):    {fmt(data.get('financial_items'))}")
    print(f"Resultat före skatt (EBT):        {fmt(data.get('pre_tax_income'))}")
    print(f"Nettoresultat (Net Income):       {fmt(data.get('net_income'))}")
    print("-" * 50)
    print(f"Totala tillgångar (Assets):       {fmt(data.get('total_assets'))}")
    print(f"Eget kapital (Equity):            {fmt(data.get('total_equity'))}")
    print(f"Totala skulder (Liabilities):     {fmt(data.get('total_liabilities'))}")
    print("-" * 50)
    print(f"Operativt kassaflöde (OCF):       {fmt(data.get('cash_flow_from_operating_activities'))}")
    print(f"Investeringskassaflöde (CapEx):   {fmt(data.get('cash_flow_from_investing_activities'))}")
    print(f"Finansieringskassaflöde (FinEx):  {fmt(data.get('cash_flow_from_financing_activities'))}")
    print("=" * 50)

if __name__ == "__main__":
    fetch_financial_report(COMPANY_ISIN, PERIOD)
