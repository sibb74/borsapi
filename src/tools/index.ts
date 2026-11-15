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
import { getCompanyInsiderTransactions, getCompanyInsiderTransactionsSchema } from "./get-company-insider-transactions.js";
import { listInsiderTransactions, listInsiderTransactionsSchema } from "./list-insider-transactions.js";
import { getCompanyInsiderStatistics, getCompanyInsiderStatisticsSchema } from "./get-company-insider-statistics.js";
import { exportCompanyReports, exportCompanyReportsSchema } from "./export-company-reports.js";
import { requestCompanyPriority, requestCompanyPrioritySchema } from "./request-company-priority.js";
import { getReportCalendar, getReportCalendarSchema } from "./get-report-calendar.js";
import { getCompanyCalendar, getCompanyCalendarSchema } from "./get-company-calendar.js";
import { getMarketFeed, getMarketFeedSchema } from "./get-market-feed.js";
import { getLatestReports, getLatestReportsSchema } from "./get-latest-reports.js";
import { searchFunds, searchFundsSchema } from "./search-funds.js";
import { getFund, getFundSchema } from "./get-fund.js";
import { getFundNav, getFundNavSchema } from "./get-fund-nav.js";
import { getFundHoldings, getFundHoldingsSchema } from "./get-fund-holdings.js";

const SIGN_CONVENTION =
  "Costs, expenses, taxes, liabilities, and cash outflows are negative values. Revenues, assets, and inflows are positive.";

export function registerTools(server: McpServer, client: BorsApiClient): void {
  server.registerTool(
    "search_companies",
    {
      description:
        "Search and list listed companies in Sweden and US (S&P 500, Nasdaq 100). Filter by name, ticker, ISIN, sector, market, or country. Volvo (VOLV-B) and SKF (SKF-B) are free in Developer Sandbox (0 quota). Returns paginated results.",
      inputSchema: searchCompaniesSchema,
    },
    async (args) => searchCompanies(client, args)
  );

  server.registerTool(
    "get_company",
    {
      description: "Get details for a specific listed company (Sweden or US) by UUID, ISIN, or ticker (e.g. VOLV-B, AAPL).",
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
      description: `List financial reports for a company. Without merge, each period is three rows (RR, BR, KA) and quota is per row. merge=true returns one row per period and charges one quota unit per period. Company id accepts UUID, ISIN, or ticker. ${SIGN_CONVENTION}`,
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
    "list_insider_transactions",
    {
      description: "List insider transactions across all companies. from/to and from_date/to_date both work. Free quota. is_related_party is boolean.",
      inputSchema: listInsiderTransactionsSchema,
    },
    async (args) => listInsiderTransactions(client, args)
  );

  server.registerTool(
    "get_company_insider_transactions",
    {
      description: "Get insider transactions (insynshandel) for a company from Finansinspektionen. Filter by transaction_type, role, date range.",
      inputSchema: getCompanyInsiderTransactionsSchema,
    },
    async (args) => getCompanyInsiderTransactions(client, args)
  );

  server.registerTool(
    "get_company_insider_statistics",
    {
      description: "Get aggregated insider trading statistics for a company over 30d, 90d, and 365d (net buy/sell values, CEO activity).",
      inputSchema: getCompanyInsiderStatisticsSchema,
    },
    async (args) => getCompanyInsiderStatistics(client, args)
  );

  server.registerTool(
    "export_company_reports",
    {
      description: "Export financial reports for a company in CSV format for analysis.",
      inputSchema: exportCompanyReportsSchema,
    },
    async (args) => exportCompanyReports(client, args)
  );

  server.registerTool(
    "request_company_priority",
    {
      description: "Request priority scraping for a specific Swedish listed company.",
      inputSchema: requestCompanyPrioritySchema,
    },
    async (args) => requestCompanyPriority(client, args)
  );

  server.registerTool(
    "get_report_calendar",
    {
      description:
        "Get upcoming reports and corporate events (financial reports, dividends, AGM) for Swedish listed companies within a date range.",
      inputSchema: getReportCalendarSchema,
    },
    async (args) => getReportCalendar(client, args)
  );

  server.registerTool(
    "get_company_calendar",
    {
      description:
        "Get upcoming reports and corporate events (reports, dividends) for a specific Swedish company by UUID, ISIN, or Ticker.",
      inputSchema: getCompanyCalendarSchema,
    },
    async (args) => getCompanyCalendar(client, args)
  );

  server.registerTool(
    "get_market_feed",
    {
      description:
        "Get a unified market activity feed across Swedish listed companies (new reports, insider transactions, short selling, upcoming calendar events). Supports since timestamp and filtering by types.",
      inputSchema: getMarketFeedSchema,
    },
    async (args) => getMarketFeed(client, args)
  );

  server.registerTool(
    "get_latest_reports",
    {
      description: `Get the most recently registered financial reports across all listed companies (Sweden and US). Supports filtering by report_type, entity_type, period_type, and dates. ${SIGN_CONVENTION}`,
      inputSchema: getLatestReportsSchema,
    },
    async (args) => getLatestReports(client, args)
  );

  server.registerTool(
    "search_funds",
    {
      description:
        "Search and list Swedish and Nordic mutual funds (PPM & UCITS). Filter by name, category, manager, or ISIN, and sort by returns (1m, 3m, ytd, 1y, 3y, 5y) or fees. Sandbox fund Spiltan (SE0000429821) is 0 quota.",
      inputSchema: searchFundsSchema,
    },
    async (args) => searchFunds(client, args)
  );

  server.registerTool(
    "get_fund",
    {
      description:
        "Get detailed information for a mutual fund by UUID, ISIN (e.g. SE0000429821), or PPM number. Includes fee structure, category, returns, latest NAV, and KID URL.",
      inputSchema: getFundSchema,
    },
    async (args) => getFund(client, args)
  );

  server.registerTool(
    "get_fund_nav",
    {
      description:
        "Get historical daily NAV time series for a mutual fund. Quota-free (0 quota units) on all plans. Sandbox fund Spiltan (SE0000429821) has full history.",
      inputSchema: getFundNavSchema,
    },
    async (args) => getFundNav(client, args)
  );

  server.registerTool(
    "get_fund_holdings",
    {
      description:
        "Get portfolio holdings (stocks and asset allocations) for a mutual fund with weights and associated BörsAPI tickers. Quota-free.",
      inputSchema: getFundHoldingsSchema,
    },
    async (args) => getFundHoldings(client, args)
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
        "Validate the configured API key and return subscription plan, monthly quota (monthly_limit, usage_30d, remaining, reset_at), and sandbox info.",
      inputSchema: {},
    },
    async () => checkApiKey(client)
  );
}
