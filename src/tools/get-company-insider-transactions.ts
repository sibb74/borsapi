import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getCompanyInsiderTransactionsSchema = z.object({
  id: z.string().describe("Company UUID or ISIN code"),
  transaction_type: z
    .enum(["BUY", "SELL", "GRANT", "EXERCISE", "OTHER"])
    .optional()
    .describe("Filter by transaction type (BUY, SELL, GRANT, EXERCISE, OTHER)"),
  role: z.string().optional().describe("Filter by PDMR role (e.g. 'VD', 'Styrelseledamot')"),
  from_date: z.string().optional().describe("Filter transactions from date (YYYY-MM-DD)"),
  to_date: z.string().optional().describe("Filter transactions to date (YYYY-MM-DD)"),
  limit: z.number().int().min(1).max(100).optional().default(20).describe("Max transactions to return (default 20, max 100)"),
  offset: z.number().int().min(0).optional().default(0).describe("Number of transactions to skip"),
});

export type GetCompanyInsiderTransactionsArgs = z.infer<typeof getCompanyInsiderTransactionsSchema>;

export async function getCompanyInsiderTransactions(
  client: BorsApiClient,
  args: GetCompanyInsiderTransactionsArgs
) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.id)}/insider-transactions`, {
      transaction_type: args.transaction_type,
      role: args.role,
      from_date: args.from_date,
      to_date: args.to_date,
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
