import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BorsApiClient } from "../src/client.js";
import { searchFunds } from "../src/tools/search-funds.js";
import { getFund } from "../src/tools/get-fund.js";
import { getFundNav } from "../src/tools/get-fund-nav.js";
import { getFundHoldings } from "../src/tools/get-fund-holdings.js";
import { searchCompanies } from "../src/tools/search-companies.js";

describe("funds and company filter tool handlers", () => {
  const client = new BorsApiClient(
    { apiKey: "test-api-key", baseUrl: "https://borsapi.se" },
    {
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.includes("/api/v1/funds/SE0000429821/nav")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                fund_id: "fund-1",
                isin: "SE0000429821",
                name: "Spiltan Aktiefond Investmentbolag",
                currency: "SEK",
                data: [{ date: "2026-11-14", nav: 345.5, currency: "SEK" }],
              }),
          } as Response;
        }

        if (url.includes("/api/v1/funds/SE0000429821/holdings")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                fund_id: "fund-1",
                isin: "SE0000429821",
                name: "Spiltan Aktiefond Investmentbolag",
                holdings: [
                  { holding_name: "Investor B", weight_percent: 28.5 },
                  { holding_name: "Industrivärden C", weight_percent: 14.2 },
                ],
              }),
          } as Response;
        }

        if (url.includes("/api/v1/funds/SE0000429821")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                data: {
                  id: "fund-1",
                  isin: "SE0000429821",
                  name: "Spiltan Aktiefond Investmentbolag",
                  manager_name: "Spiltan Fonder",
                  category: "Aktiefonder",
                  total_fee_percent: 0.24,
                  latest_nav: 345.5,
                },
              }),
          } as Response;
        }

        if (url.includes("/api/v1/funds")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                data: [
                  {
                    id: "fund-1",
                    isin: "SE0000429821",
                    name: "Spiltan Aktiefond Investmentbolag",
                    manager_name: "Spiltan Fonder",
                  },
                ],
                total: 1,
              }),
          } as Response;
        }

        if (url.includes("/api/v1/companies")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                data: [
                  {
                    id: "comp-apple",
                    ticker: "AAPL",
                    name: "Apple Inc.",
                    country: "US",
                  },
                ],
                total: 1,
              }),
          } as Response;
        }

        return {
          ok: false,
          status: 404,
          text: async () => JSON.stringify({ error: "Not found", code: "NOT_FOUND" }),
        } as Response;
      }) as typeof fetch,
    }
  );

  test("searchFunds returns funds list JSON", async () => {
    const res = await searchFunds(client, { search: "spiltan", limit: 10 });
    assert.equal(res.isError, undefined);
    assert.equal(res.content.length, 1);
    const parsed = JSON.parse(res.content[0].text);
    assert.equal(parsed.data[0].isin, "SE0000429821");
  });

  test("getFund returns single fund metadata", async () => {
    const res = await getFund(client, { fund_id: "SE0000429821" });
    assert.equal(res.isError, undefined);
    const parsed = JSON.parse(res.content[0].text);
    assert.equal(parsed.data.name, "Spiltan Aktiefond Investmentbolag");
  });

  test("getFundNav returns historical NAV data", async () => {
    const res = await getFundNav(client, {
      fund_id: "SE0000429821",
      from: "2026-01-01",
      limit: 10,
    });
    assert.equal(res.isError, undefined);
    const parsed = JSON.parse(res.content[0].text);
    assert.equal(parsed.data[0].nav, 345.5);
  });

  test("getFundHoldings returns portfolio holdings", async () => {
    const res = await getFundHoldings(client, { fund_id: "SE0000429821" });
    assert.equal(res.isError, undefined);
    const parsed = JSON.parse(res.content[0].text);
    assert.equal(parsed.holdings[0].holding_name, "Investor B");
  });

  test("searchCompanies accepts country parameter for US stocks", async () => {
    const res = await searchCompanies(client, { country: "US", search: "apple" });
    assert.equal(res.isError, undefined);
    const parsed = JSON.parse(res.content[0].text);
    assert.equal(parsed.data[0].ticker, "AAPL");
  });

  test("fund tool handlers return isError on failure", async () => {
    const errorClient = new BorsApiClient(
      { apiKey: "test-api-key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: (async () => ({
          ok: false,
          status: 404,
          text: async () => JSON.stringify({ error: "Fonden hittades inte", code: "NOT_FOUND" }),
        })) as unknown as typeof fetch,
      }
    );

    const res = await getFund(errorClient, { fund_id: "INVALID_ISIN" });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /Not found/);
  });
});
