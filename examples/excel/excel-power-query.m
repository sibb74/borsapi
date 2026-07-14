/*
  BörsAPI Excel Power Query integration (M-kod)
  
  Gör så här för att använda i Microsoft Excel:
  1. Öppna Excel.
  2. Gå till fliken Data -> Hämta data (Get Data) -> Från andra källor -> Tom fråga (Blank Query).
  3. Klicka på "Avancerad redigerare" (Advanced Editor) i Power Query-fönstret.
  4. Klistra in koden nedan.
  5. Ersätt "DIN_API_NYCKEL" med din faktiska nyckel.
  6. Klicka på "Klar" (Done) och sedan "Stäng och läs in" (Close & Load).
*/

let
    // Ange din API-nyckel här (börjar med fd_...)
    ApiKey = "DIN_API_NYCKEL", 

    // Ange ISIN-koden för bolaget du vill hämta data för (t.ex. Volvo B: SE0000115446)
    IsinCode = "SE0000115446",

    // Ange perioden (t.ex. "2023", "2024-Q3" eller "2024-Q3 TTM")
    Period = "2023",

    // Ange typ av rapport (CONSOLIDATED = koncern, PARENT = moderbolag)
    EntityType = "CONSOLIDATED",

    // URL till BörsAPI-endpointen
    Url = "https://borsapi.se/api/v1/companies/" & IsinCode & "/reports/" & Uri.EscapeDataString(Period) & "?entity_type=" & EntityType,

    // Hämta JSON-svar med Authorization Header
    Source = Json.Document(Web.Contents(Url, [Headers=[
        Authorization="Bearer " & ApiKey,
        Accept="application/json"
    ]])),

    // Konvertera poster till en tabell
    ToTable = Record.ToTable(Source),
    
    // Filtrera bort metadata-objekt om du bara vill ha finansiella siffror
    FilteredRows = Table.SelectRows(ToTable, each ([Name] <> "company" and [Name] <> "id" and [Name] <> "company_id")),
    
    // Byt namn på kolumner
    RenameColumns = Table.RenameColumns(FilteredRows,{{"Name", "Finansiell post"}, {"Value", "Belopp (SEK)"}}),
    
    // Justera datatyper
    TypedColumns = Table.TransformColumnTypes(RenameColumns,{{"Belopp (SEK)", type any}})
in
    TypedColumns
