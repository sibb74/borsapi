import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getCompanyShortPositionsSchema = z.object({
  id: z.string().describe("Company UUID or ISIN code"),
  is_active: z.boolean().optional().describe("Filter by active position (>=0.5%) if true, or historical if false"),
  limit: z.number().int().min(1).max(100).optional().default(20).describe("Max positions to return (default 20, max 100)"),
  offset: z.number().int().min(0).optional().default(0).describe("Number of positions to skip"),
});

export type GetCompanyShortPositionsArgs = z.infer<typeof getCompanyShortPositionsSchema>;

export async function getCompanyShortPositions(
  client: BorsApiClient,
  args: GetCompanyShortPositionsArgs
) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.id)}/short-positions`, {
      is_active: args.is_active,
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
