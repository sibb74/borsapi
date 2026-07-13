import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getCompanySchema = {
  company_id: z.string().describe("Company UUID or ISIN (e.g. SE0000115446)"),
};

export async function getCompany(client: BorsApiClient, args: z.infer<z.ZodObject<typeof getCompanySchema>>) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.company_id)}`);
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
