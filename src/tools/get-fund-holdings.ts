import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getFundHoldingsSchema = {
  fund_id: z.string().describe("Fund UUID, ISIN (e.g. SE0000429821), or PPM number (e.g. 582106)"),
};

export async function getFundHoldings(client: BorsApiClient, args: z.infer<z.ZodObject<typeof getFundHoldingsSchema>>) {
  try {
    const data = await client.get(`/api/v1/funds/${encodeURIComponent(args.fund_id)}/holdings`);
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
