import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const listShortPositionsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20).describe("Max companies to return (default 20, max 100)"),
  offset: z.number().int().min(0).optional().default(0).describe("Number of companies to skip"),
  min_percentage: z.number().optional().default(0.5).describe("Minimum total short percentage filter (default 0.5%)"),
});

export type ListShortPositionsArgs = z.infer<typeof listShortPositionsSchema>;

export async function listShortPositions(
  client: BorsApiClient,
  args: ListShortPositionsArgs
) {
  try {
    const data = await client.get("/api/v1/short-positions", {
      limit: args.limit,
      offset: args.offset,
      min_percentage: args.min_percentage,
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
