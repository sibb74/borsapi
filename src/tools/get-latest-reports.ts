import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getLatestReportsSchema = z.object({
  report_type: z
    .enum(["RR", "BR", "KA"])
    .optional()
    .describe("Filter by report type: RR (income statement), BR (balance sheet), KA (cash flow)"),
  entity_type: z
    .enum(["CONSOLIDATED", "PARENT"])
    .optional()
    .default("CONSOLIDATED")
    .describe("Filter by entity type (CONSOLIDATED or PARENT, default CONSOLIDATED)"),
  period_type: z
    .enum(["year", "quarter", "all"])
    .optional()
    .default("all")
    .describe("Filter by period type: year (annual reports), quarter (quarterly), or all"),
  from_year: z.number().int().optional().describe("Filter reports from this fiscal year"),
  to_year: z.number().int().optional().describe("Filter reports up to this fiscal year"),
  from_date: z.string().optional().describe("Start report date YYYY-MM-DD"),
  to_date: z.string().optional().describe("End report date YYYY-MM-DD"),
  since: z.string().optional().describe("Filter by created_at ISO timestamp or date"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe("Max number of reports to return (1-100, default 50)"),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe("Pagination offset (default 0)"),
});

export type GetLatestReportsArgs = z.infer<typeof getLatestReportsSchema>;

export async function getLatestReports(client: BorsApiClient, args: GetLatestReportsArgs) {
  try {
    const data = await client.get("/api/v1/reports/latest", {
      report_type: args.report_type,
      entity_type: args.entity_type,
      period_type: args.period_type,
      from_year: args.from_year,
      to_year: args.to_year,
      from: args.from_date,
      to: args.to_date,
      since: args.since,
      limit: args.limit,
      offset: args.offset,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text" as const, text: formatApiError(error) }],
      isError: true,
    };
  }
}
