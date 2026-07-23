import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getCompanyShortStatisticsSchema = z.object({
  id: z.string().describe("Company UUID or ISIN code"),
});

export type GetCompanyShortStatisticsArgs = z.infer<typeof getCompanyShortStatisticsSchema>;

export async function getCompanyShortStatistics(
  client: BorsApiClient,
  args: GetCompanyShortStatisticsArgs
) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.id)}/short-statistics`);

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
