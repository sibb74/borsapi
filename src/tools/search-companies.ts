import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const searchCompaniesSchema = {
  search: z.string().optional().describe("Search by company name or ticker (case-insensitive)"),
  ticker: z.string().optional().describe("Exact ticker match (e.g. VOLV-B)"),
  isin: z.string().optional().describe("Exact ISIN match (e.g. SE0000115446)"),
  sector: z.string().optional().describe("Filter by sector"),
  market: z.string().optional().describe("Market code: XSTO, FNSE, XNGM, XSAT, or all"),
  include_mtf: z.boolean().optional().describe("Include MTF markets (First North, Spotlight, NGM). Default: false"),
  limit: z.number().int().min(1).max(100).optional().describe("Max results (1-100, default 20)"),
  offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
};

export async function searchCompanies(client: BorsApiClient, args: z.infer<z.ZodObject<typeof searchCompaniesSchema>>) {
  try {
    const data = await client.get("/api/v1/companies", args);
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
