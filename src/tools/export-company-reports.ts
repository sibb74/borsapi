import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const exportCompanyReportsSchema = z.object({
  id: z.string().describe("Company UUID, ISIN, or ticker (e.g. VOLV-B)"),
  report_type: z.enum(["RR", "BR", "KA"]).optional().describe("Report type: RR (Income statement), BR (Balance sheet), KA (Cash flow statement)"),
  entity_type: z.enum(["CONSOLIDATED", "PARENT"]).optional().default("CONSOLIDATED").describe("CONSOLIDATED (default) or PARENT"),
  period_type: z.enum(["year", "quarter", "ttm", "all"]).optional().default("year").describe("Period type: year (default), quarter, ttm, or all"),
  from_year: z.number().int().optional().describe("Start year filter (e.g. 2020)"),
  to_year: z.number().int().optional().describe("End year filter (e.g. 2024)"),
});

export type ExportCompanyReportsArgs = z.infer<typeof exportCompanyReportsSchema>;

export async function exportCompanyReports(
  client: BorsApiClient,
  args: ExportCompanyReportsArgs
) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.id)}/reports/export`, {
      report_type: args.report_type,
      entity_type: args.entity_type,
      period_type: args.period_type,
      from_year: args.from_year,
      to_year: args.to_year,
    });

    return {
      content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text" as const, text: formatApiError(error) }],
      isError: true,
    };
  }
}
