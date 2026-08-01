import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getCompanyInsiderStatisticsSchema = z.object({
  id: z.string().describe("Company UUID or ISIN code"),
});

export type GetCompanyInsiderStatisticsArgs = z.infer<typeof getCompanyInsiderStatisticsSchema>;

export async function getCompanyInsiderStatistics(
  client: BorsApiClient,
  args: GetCompanyInsiderStatisticsArgs
) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.id)}/insider-statistics`);

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
