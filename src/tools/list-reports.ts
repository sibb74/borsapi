import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const listReportsSchema = {
  company_id: z.string().describe("Company UUID or ISIN (e.g. SE0000115446)"),
  report_type: z.enum(["RR", "BR", "KA"]).optional().describe("Filter by report type: RR (income), BR (balance), KA (cash flow)"),
  entity_type: z.enum(["CONSOLIDATED", "PARENT"]).optional().describe("Entity type. Default: CONSOLIDATED"),
  period_type: z.enum(["year", "quarter", "ttm", "all"]).optional().describe("Period length filter. Default: all"),
  from_year: z.number().int().optional().describe("Start year filter"),
  to_year: z.number().int().optional().describe("End year filter"),
  limit: z.number().int().min(1).max(100).optional().describe("Max results (1-100, default 20)"),
  offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
  sort: z.enum(["report_date", "period"]).optional().describe("Sort field. Default: report_date"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort order. Default: desc"),
};

export async function listReports(client: BorsApiClient, args: z.infer<z.ZodObject<typeof listReportsSchema>>) {
  const { company_id, ...params } = args;

  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(company_id)}/reports`, params);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true as const,
      content: [{ type: "text" as const, text: formatApiError(error) }],
    };
  }
}
