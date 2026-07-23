import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BorsApiClient } from "../client.js";
import { checkApiKey } from "./check-api-key.js";
import { getCompanyCoverage, getCompanyCoverageSchema } from "./get-company-coverage.js";
import { getCompany, getCompanySchema } from "./get-company.js";
import { getCoverageStats } from "./get-coverage-stats.js";
import { getReport, getReportSchema } from "./get-report.js";
import { listReports, listReportsSchema } from "./list-reports.js";
import { searchCompanies, searchCompaniesSchema } from "./search-companies.js";
import { getCompanyShortPositions, getCompanyShortPositionsSchema } from "./get-company-short-positions.js";
import { getCompanyShortStatistics, getCompanyShortStatisticsSchema } from "./get-company-short-statistics.js";
import { listShortPositions, listShortPositionsSchema } from "./list-short-positions.js";

const SIGN_CONVENTION =
  "Costs, expenses, taxes, liabilities, and cash outflows are negative values. Revenues, assets, and inflows are positive.";

export function registerTools(server: McpServer, client: BorsApiClient): void {
  server.registerTool(
    "search_companies",
    {
      description:
        "Search and list Swedish listed companies. Filter by name, ticker, ISIN, sector, or market. Returns paginated results.",
      inputSchema: searchCompaniesSchema,
    },
    async (args) => searchCompanies(client, args)
  );

  server.registerTool(
    "get_company",
    {
      description: "Get details for a specific Swedish listed company by UUID or ISIN.",
      inputSchema: getCompanySchema,
    },
    async (args) => getCompany(client, args)
  );

  server.registerTool(
    "get_company_coverage",
    {
      description:
        "Get report coverage for a company: which periods and report types (RR, BR, KA) are available in the database.",
      inputSchema: getCompanyCoverageSchema,
    },
    async (args) => getCompanyCoverage(client, args)
  );

  server.registerTool(
    "list_reports",
    {
      description: `List financial reports for a company with optional filters. ${SIGN_CONVENTION}`,
      inputSchema: listReportsSchema,
    },
    async (args) => listReports(client, args)
  );

  server.registerTool(
    "get_report",
    {
      description: `Get a specific financial report for a company and period. Returns consolidated RR, BR, and KA by default. ${SIGN_CONVENTION}`,
      inputSchema: getReportSchema,
    },
    async (args) => getReport(client, args)
  );

  server.registerTool(
    "get_company_short_positions",
    {
      description: "Get raw short selling positions (blankning) for a company from Finansinspektionen.",
      inputSchema: getCompanyShortPositionsSchema,
    },
    async (args) => getCompanyShortPositions(client, args)
  );

  server.registerTool(
    "get_company_short_statistics",
    {
      description: "Get aggregated short selling statistics (% total shorted, active holders count) for a company.",
      inputSchema: getCompanyShortStatisticsSchema,
    },
    async (args) => getCompanyShortStatistics(client, args)
  );

  server.registerTool(
    "list_short_positions",
    {
      description: "List the most shorted Swedish listed companies and global active short positions.",
      inputSchema: listShortPositionsSchema,
    },
    async (args) => listShortPositions(client, args)
  );

  server.registerTool(
    "get_coverage_stats",
    {
      description:
        "Get overall database statistics (total companies, annual reports, quarterly reports, datapoints). No authentication required.",
      inputSchema: {},
    },
    async () => getCoverageStats(client)
  );

  server.registerTool(
    "check_api_key",
    {
      description:
        "Validate the configured API key and return remaining quota (usage_today, daily_limit, remaining).",
      inputSchema: {},
    },
    async () => checkApiKey(client)
  );
}
