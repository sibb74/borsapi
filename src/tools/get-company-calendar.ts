import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getCompanyCalendarSchema = z.object({
  id: z.string().describe("Company UUID, ISIN code, or Ticker symbol (e.g. 'VOLV-B')"),
  status: z.enum(["upcoming", "past", "all"]).optional().default("all").describe("Filter events: upcoming (future only), past (historical only), or all"),
  event_type: z.string().optional().describe("Filter by event type (e.g. INTERIM, YEAR_END, ANNUAL_REPORT, DIVIDEND)"),
});

export type GetCompanyCalendarArgs = z.infer<typeof getCompanyCalendarSchema>;

export async function getCompanyCalendar(
  client: BorsApiClient,
  args: GetCompanyCalendarArgs
) {
  try {
    const data = await client.get(`/api/v1/companies/${encodeURIComponent(args.id)}/calendar`, {
      status: args.status,
      event_type: args.event_type,
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
