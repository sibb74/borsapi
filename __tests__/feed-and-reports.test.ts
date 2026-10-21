import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BorsApiClient } from "../src/client.js";
import { getMarketFeed } from "../src/tools/get-market-feed.js";
import { getLatestReports } from "../src/tools/get-latest-reports.js";

describe("feed and latest reports tool handlers", () => {
  const client = new BorsApiClient(
    { apiKey: "test-api-key", baseUrl: "https://borsapi.se" },
    {
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.includes("/api/v1/feed")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                feed: {
                  reports: [],
                  insider: [],
                  shorts: [],
                  calendar: [],
                },
                counts: { reports: 0, insider: 0, shorts: 0, calendar: 0 },
              }),
          } as Response;
        }

        if (url.includes("/api/v1/reports/latest")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                data: [
                  {
                    id: "rep-1",
                    period: "2026-Q2",
                    report_type: "RR",
                    company_name: "Husqvarna AB",
                  },
                ],
                total: 1,
                limit: 50,
                offset: 0,
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

  test("getMarketFeed returns feed JSON", async () => {
    const res = await getMarketFeed(client, { limit: 10, types: "reports,insider" });
    assert.strictEqual(res.isError, undefined);
    assert.strictEqual(res.content[0].type, "text");
    const parsed = JSON.parse(res.content[0].text);
    assert.ok(parsed.feed);
    assert.ok(parsed.counts);
  });

  test("getLatestReports returns latest reports JSON", async () => {
    const res = await getLatestReports(client, {
      report_type: "RR",
      period_type: "quarter",
      limit: 10,
      offset: 0,
    });
    assert.strictEqual(res.isError, undefined);
    assert.strictEqual(res.content[0].type, "text");
    const parsed = JSON.parse(res.content[0].text);
    assert.strictEqual(parsed.data[0].id, "rep-1");
    assert.strictEqual(parsed.total, 1);
  });

  test("tool handlers return isError on failure", async () => {
    const failingClient = new BorsApiClient(
      { apiKey: "test-api-key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: (async () => {
          return {
            ok: false,
            status: 500,
            text: async () => JSON.stringify({ error: "Server error", code: "INTERNAL_ERROR" }),
          } as Response;
        }) as typeof fetch,
      }
    );

    const feedRes = await getMarketFeed(failingClient, { limit: 5 });
    assert.strictEqual(feedRes.isError, true);
    assert.match(feedRes.content[0].text, /500|Server error/);

    const repRes = await getLatestReports(failingClient, { limit: 5 });
    assert.strictEqual(repRes.isError, true);
    assert.match(repRes.content[0].text, /500|Server error/);
  });
});
