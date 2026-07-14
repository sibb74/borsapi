import { describe, test, mock } from "node:test";
import assert from "node:assert/strict";
import { BorsApiClient, formatApiError } from "../src/client.js";
import { BorsApiError } from "../src/types.js";
import { loadConfig } from "../src/config.js";
import { searchCompanies } from "../src/tools/search-companies.js";
import { getCompany } from "../src/tools/get-company.js";
import { getCompanyCoverage } from "../src/tools/get-company-coverage.js";
import { listReports } from "../src/tools/list-reports.js";
import { getReport } from "../src/tools/get-report.js";
import { getCoverageStats } from "../src/tools/get-coverage-stats.js";
import { checkApiKey } from "../src/tools/check-api-key.js";

function createMockFetch(response: {
  ok: boolean;
  status: number;
  body: unknown;
}): typeof fetch {
  return mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = init?.headers as Record<string, string> | undefined;

    return {
      ok: response.ok,
      status: response.status,
      text: async () => JSON.stringify(response.body),
      url,
      headers: new Headers(headers),
    } as Response;
  }) as unknown as typeof fetch;
}

describe("BorsApiClient", () => {
  test("sends Bearer auth and query params on GET", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};

    const fetchImpl = mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedHeaders = init?.headers as Record<string, string>;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [], total: 0 }),
      } as Response;
    }) as unknown as typeof fetch;

    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      { fetchImpl }
    );

    await client.get("/api/v1/companies", { search: "Volvo", limit: 5 });

    assert.match(capturedUrl, /^https:\/\/borsapi\.se\/api\/v1\/companies\?/);
    assert.match(capturedUrl, /search=Volvo/);
    assert.match(capturedUrl, /limit=5/);
    assert.equal(capturedHeaders.Authorization, "Bearer fd_test_key");
  });

  test("throws BorsApiError for non-2xx responses", async () => {
    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: createMockFetch({
          ok: false,
          status: 401,
          body: { error: "Invalid API key", code: "INVALID_API_KEY" },
        }),
      }
    );

    await assert.rejects(
      () => client.get("/api/v1/test"),
      (error: unknown) => {
        assert.ok(error instanceof BorsApiError);
        assert.equal(error.status, 401);
        assert.equal(error.code, "INVALID_API_KEY");
        return true;
      }
    );
  });

  test("can call public endpoints without auth header", async () => {
    let capturedHeaders: Record<string, string> = {};

    const fetchImpl = mock.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ totalCompanies: 100 }),
      } as Response;
    }) as unknown as typeof fetch;

    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      { fetchImpl }
    );

    await client.get("/api/v1/coverage/stats", undefined, false);
    assert.equal(capturedHeaders.Authorization, undefined);
  });
});

describe("formatApiError", () => {
  test("maps 401 to helpful message", () => {
    const message = formatApiError(new BorsApiError(401, "Invalid API key", "INVALID_API_KEY"));
    assert.match(message, /Invalid API key/i);
    assert.match(message, /dashboard/i);
  });

  test("maps 429 to rate limit message", () => {
    const message = formatApiError(new BorsApiError(429, "Rate limit exceeded", "RATE_LIMIT_EXCEEDED"));
    assert.match(message, /Rate limit exceeded/i);
    assert.match(message, /check_api_key/i);
  });
});

describe("loadConfig", () => {
  const originalApiKey = process.env.BORSAPI_API_KEY;
  const originalBaseUrl = process.env.BORSAPI_BASE_URL;

  test("requires BORSAPI_API_KEY", () => {
    delete process.env.BORSAPI_API_KEY;
    assert.throws(() => loadConfig(), /BORSAPI_API_KEY is required/);
  });

  test("defaults base URL to production", () => {
    process.env.BORSAPI_API_KEY = "fd_test_key";
    delete process.env.BORSAPI_BASE_URL;
    const config = loadConfig();
    assert.equal(config.baseUrl, "https://borsapi.se");
  });

  test("strips trailing slash from base URL", () => {
    process.env.BORSAPI_API_KEY = "fd_test_key";
    process.env.BORSAPI_BASE_URL = "http://localhost:3000/";
    const config = loadConfig();
    assert.equal(config.baseUrl, "http://localhost:3000");
  });

  process.env.BORSAPI_API_KEY = originalApiKey;
  process.env.BORSAPI_BASE_URL = originalBaseUrl;
});

describe("tool handlers", () => {
  const client = new BorsApiClient(
    { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
    {
      fetchImpl: mock.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/v1/companies?")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: [{ ticker: "VOLV-B" }], total: 1 }),
          } as Response;
        }

        if (url.includes("/reports/2024-Q3")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ period: "2024-Q3", revenue: 100 }),
          } as Response;
        }

        if (url.includes("/coverage") && !url.includes("/coverage/stats")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ periods: ["2023", "2024"], reports: { RR: true, BR: true } }),
          } as Response;
        }

        if (url.includes("/reports") && url.includes("SE0000115446")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: [{ period: "2023", revenue: 200 }], total: 1 }),
          } as Response;
        }

        if (url.includes("/api/v1/companies/SE0000115446")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ id: "1", ticker: "VOLV-B", name: "Volvo AB" }),
          } as Response;
        }

        if (url.includes("/api/v1/coverage/stats")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ totalCompanies: 200 }),
          } as Response;
        }

        if (url.includes("/api/v1/test")) {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                success: true,
                usage: { usage_today: 1, daily_limit: 100, remaining: 99 },
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

  test("search_companies returns JSON text content", async () => {
    const result = await searchCompanies(client, { search: "Volvo" });
    assert.equal(result.isError, undefined);
    assert.equal(result.content[0]?.type, "text");
    assert.match(result.content[0]?.text ?? "", /VOLV-B/);
  });

  test("get_company encodes company id in path", async () => {
    const result = await getCompany(client, { company_id: "SE0000115446" });
    assert.match(result.content[0]?.text ?? "", /Volvo AB/);
  });

  test("get_report encodes period in path", async () => {
    const result = await getReport(client, {
      company_id: "SE0000115446",
      period: "2024-Q3",
    });
    assert.match(result.content[0]?.text ?? "", /2024-Q3/);
  });

  test("get_coverage_stats works without auth", async () => {
    const result = await getCoverageStats(client);
    assert.match(result.content[0]?.text ?? "", /totalCompanies/);
  });

  test("check_api_key returns usage info", async () => {
    const result = await checkApiKey(client);
    assert.match(result.content[0]?.text ?? "", /remaining/);
  });

  test("get_company_coverage returns coverage data", async () => {
    const result = await getCompanyCoverage(client, { company_id: "SE0000115446" });
    assert.equal(result.isError, undefined);
    assert.match(result.content[0]?.text ?? "", /periods/);
    assert.match(result.content[0]?.text ?? "", /RR/);
  });

  test("list_reports returns paginated results", async () => {
    const result = await listReports(client, { company_id: "SE0000115446", period_type: "year" });
    assert.equal(result.isError, undefined);
    assert.match(result.content[0]?.text ?? "", /revenue/);
    assert.match(result.content[0]?.text ?? "", /2023/);
  });

  test("list_reports passes query params", async () => {
    const result = await listReports(client, {
      company_id: "SE0000115446",
      report_type: "RR",
      from_year: 2020,
      to_year: 2023,
      limit: 10,
    });
    assert.equal(result.isError, undefined);
    assert.equal(result.content[0]?.type, "text");
  });

  test("tool handlers return isError on API failure", async () => {
    const failingClient = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: createMockFetch({
          ok: false,
          status: 404,
          body: { error: "Company not found", code: "NOT_FOUND" },
        }),
      }
    );

    const result = await getCompany(failingClient, { company_id: "missing" });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? "", /Not found/i);
  });

  test("list_reports returns isError on API failure", async () => {
    const failingClient = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: createMockFetch({
          ok: false,
          status: 404,
          body: { error: "Company not found", code: "NOT_FOUND" },
        }),
      }
    );
    const result = await listReports(failingClient, { company_id: "missing" });
    assert.equal(result.isError, true);
  });

  test("get_company_coverage returns isError on API failure", async () => {
    const failingClient = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: createMockFetch({
          ok: false,
          status: 404,
          body: { error: "Company not found", code: "NOT_FOUND" },
        }),
      }
    );
    const result = await getCompanyCoverage(failingClient, { company_id: "missing" });
    assert.equal(result.isError, true);
  });
});

describe("formatApiError edge cases", () => {
  test("maps 500 to server error message", () => {
    const message = formatApiError(new BorsApiError(500, "Internal server error", "INTERNAL_ERROR"));
    assert.match(message, /server error/i);
  });

  test("maps 404 to not found message", () => {
    const message = formatApiError(new BorsApiError(404, "Not found", "NOT_FOUND"));
    assert.match(message, /not found/i);
  });

  test("handles non-BorsApiError errors", () => {
    const message = formatApiError(new Error("Network failure"));
    assert.match(message, /Network failure/i);
  });

  test("handles non-Error objects", () => {
    const message = formatApiError("something went wrong");
    assert.match(message, /Unknown error/i);
  });
});

describe("BorsApiClient edge cases", () => {
  test("handles empty query params", async () => {
    let capturedUrl = "";
    const fetchImpl = mock.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [] }),
      } as Response;
    }) as unknown as typeof fetch;

    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      { fetchImpl }
    );

    await client.get("/api/v1/companies", {});
    assert.equal(capturedUrl, "https://borsapi.se/api/v1/companies");
  });

  test("handles undefined query params", async () => {
    let capturedUrl = "";
    const fetchImpl = mock.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [] }),
      } as Response;
    }) as unknown as typeof fetch;

    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      { fetchImpl }
    );

    await client.get("/api/v1/companies", { search: undefined, limit: 10 });
    assert.match(capturedUrl, /limit=10/);
    assert.ok(!capturedUrl.includes("search"));
  });

  test("throws on 429 rate limit", async () => {
    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: createMockFetch({
          ok: false,
          status: 429,
          body: { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
        }),
      }
    );

    await assert.rejects(
      () => client.get("/api/v1/test"),
      (error: unknown) => {
        assert.ok(error instanceof BorsApiError);
        assert.equal(error.status, 429);
        assert.equal(error.code, "RATE_LIMIT_EXCEEDED");
        return true;
      }
    );
  });

  test("throws on 500 server error", async () => {
    const client = new BorsApiClient(
      { apiKey: "fd_test_key", baseUrl: "https://borsapi.se" },
      {
        fetchImpl: createMockFetch({
          ok: false,
          status: 500,
          body: { error: "Internal error" },
        }),
      }
    );

    await assert.rejects(
      () => client.get("/api/v1/test"),
      (error: unknown) => {
        assert.ok(error instanceof BorsApiError);
        assert.equal(error.status, 500);
        return true;
      }
    );
  });
});
