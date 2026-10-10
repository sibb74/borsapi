import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const listInsiderTransactionsSchema = z.object({
  from_date: z.string().optional().describe("Start date YYYY-MM-DD. Alias of from."),
  to_date: z.string().optional().describe("End date YYYY-MM-DD. Alias of to."),
  transaction_type: z.enum(["BUY", "SELL", "GRANT", "EXERCISE", "OTHER"]).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type ListInsiderTransactionsArgs = z.infer<typeof listInsiderTransactionsSchema>;

export async function listInsiderTransactions(
  client: BorsApiClient,
  args: ListInsiderTransactionsArgs,
) {
  try {
    const data = await client.get("/api/v1/insider-transactions", {
      from_date: args.from_date,
      to_date: args.to_date,
      transaction_type: args.transaction_type,
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
