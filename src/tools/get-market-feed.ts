import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getMarketFeedSchema = z.object({
  since: z
    .string()
    .optional()
    .describe(
      "ISO timestamp or date string (e.g. 2026-10-21T00:00:00Z) to get events since. Defaults to 24 hours ago, max lookback 7 days."
    ),
  types: z
    .string()
    .optional()
    .describe(
      "Comma-separated list of event types to include: reports, insider, shorts, calendar. Defaults to all."
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe("Max items to return per event category (1-100, default 50)"),
});

export type GetMarketFeedArgs = z.infer<typeof getMarketFeedSchema>;

export async function getMarketFeed(client: BorsApiClient, args: GetMarketFeedArgs) {
  try {
    const data = await client.get("/api/v1/feed", {
      since: args.since,
      types: args.types,
      limit: args.limit,
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
