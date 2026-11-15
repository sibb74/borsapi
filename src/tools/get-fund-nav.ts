import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getFundNavSchema = {
  fund_id: z.string().describe("Fund UUID, ISIN (e.g. SE0000429821), or PPM number (e.g. 582106)"),
  from: z.string().optional().describe("Start date in YYYY-MM-DD format (e.g. 2024-01-01)"),
  to: z.string().optional().describe("End date in YYYY-MM-DD format (e.g. 2024-12-31)"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort direction by date: asc or desc (default: desc)"),
  limit: z.number().int().min(1).max(1000).optional().describe("Max data points (1-1000, default 250)"),
};

export async function getFundNav(client: BorsApiClient, args: z.infer<z.ZodObject<typeof getFundNavSchema>>) {
  try {
    const { fund_id, ...params } = args;
    const data = await client.get(`/api/v1/funds/${encodeURIComponent(fund_id)}/nav`, params);
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
