import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const searchFundsSchema = {
  search: z.string().optional().describe("Search by fund name, manager, or ISIN (case-insensitive)"),
  isin: z.string().optional().describe("Exact ISIN match (e.g. SE0000429821)"),
  category: z.string().optional().describe("Filter by fund category (e.g. Aktiefonder, Räntefonder)"),
  manager: z.string().optional().describe("Filter by manager name (e.g. Spiltan, Swedbank)"),
  order_by: z
    .enum([
      "name",
      "manager_name",
      "category",
      "total_fee_percent",
      "return_1m",
      "return_3m",
      "return_6m",
      "return_ytd",
      "return_1y",
      "return_3y",
      "return_5y_avg",
      "latest_nav",
      "latest_nav_date",
    ])
    .optional()
    .describe("Sort field (default: name)"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort direction: asc or desc (default: asc)"),
  limit: z.number().int().min(1).max(200).optional().describe("Max results (1-200, default 50)"),
  offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
};

export async function searchFunds(client: BorsApiClient, args: z.infer<z.ZodObject<typeof searchFundsSchema>>) {
  try {
    const data = await client.get("/api/v1/funds", args);
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
