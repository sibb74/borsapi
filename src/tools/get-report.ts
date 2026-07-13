import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getReportSchema = {
  company_id: z.string().describe("Company UUID or ISIN (e.g. SE0000115446)"),
  period: z.string().describe("Period (e.g. 2024, 2024-Q3)"),
  report_type: z.enum(["RR", "BR", "KA"]).optional().describe("Optional: return only one statement type instead of consolidated RR+BR+KA"),
  entity_type: z.enum(["CONSOLIDATED", "PARENT"]).optional().describe("Entity type. Default: CONSOLIDATED"),
};

export async function getReport(client: BorsApiClient, args: z.infer<z.ZodObject<typeof getReportSchema>>) {
  const { company_id, period, ...params } = args;

  try {
    const data = await client.get(
      `/api/v1/companies/${encodeURIComponent(company_id)}/reports/${encodeURIComponent(period)}`,
      params
    );
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
