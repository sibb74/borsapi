import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const requestCompanyPrioritySchema = z.object({
  company_ticker: z.string().describe("Company ticker symbol (e.g. VOLV-B)"),
  company_name: z.string().describe("Company full or short name (e.g. Volvo AB)"),
  company_id: z.string().optional().describe("Company UUID if known"),
  user_email: z.string().email().optional().describe("Optional email address to receive notification when scraping is completed"),
});

export type RequestCompanyPriorityArgs = z.infer<typeof requestCompanyPrioritySchema>;

export async function requestCompanyPriority(
  client: BorsApiClient,
  args: RequestCompanyPriorityArgs
) {
  try {
    const data = await client.post("/api/v1/priority-requests", {
      company_ticker: args.company_ticker,
      company_name: args.company_name,
      company_id: args.company_id,
      user_email: args.user_email,
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
