import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BorsApiClient } from "../src/client.js";
import { getReportCalendar } from "../src/tools/get-report-calendar.js";
import { getCompanyCalendar } from "../src/tools/get-company-calendar.js";

describe("calendar tool handlers", () => {
  const client = new BorsApiClient(
    { apiKey: "test-api-key", baseUrl: "https://borsapi.se" },
    {
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.includes("/api/v1/calendar")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                data: [
                  {
                    id: "ev-1",
                    ticker: "VOLV-B",
                    company_name: "Volvo AB",
                    event_type: "INTERIM",
                    event_date: "2026-10-23",
                  },
                ],
                pagination: { limit: 50, offset: 0, total: 1 },
              }),
          } as Response;
        }

        if (url.includes("/api/v1/companies/VOLV-B/calendar")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                company: { id: "1", ticker: "VOLV-B", name: "Volvo AB" },
                data: [
                  {
                    id: "ev-1",
                    event_type: "INTERIM",
                    event_date: "2026-10-23",
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
      }) as unknown as typeof fetch,
    }
  );

  test("getReportCalendar returns calendar data", async () => {
    const result = await getReportCalendar(client, { from: "2026-10-01", to: "2026-10-31" });
    assert.equal(result.isError, undefined);
    assert.match(result.content[0]?.text ?? "", /VOLV-B/);
    assert.match(result.content[0]?.text ?? "", /2026-10-23/);
  });

  test("getCompanyCalendar returns company-specific calendar", async () => {
    const result = await getCompanyCalendar(client, { id: "VOLV-B", status: "upcoming" });
    assert.equal(result.isError, undefined);
    assert.match(result.content[0]?.text ?? "", /Volvo AB/);
    assert.match(result.content[0]?.text ?? "", /INTERIM/);
  });
});
