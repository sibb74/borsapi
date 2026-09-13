import { z } from "zod";
import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export const getReportCalendarSchema = z.object({
  from: z.string().optional().describe("Start date in YYYY-MM-DD format (defaults to today)"),
  to: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to +30 days from start date)"),
  event_type: z.string().optional().describe("Filter by event type (e.g. INTERIM, YEAR_END, ANNUAL_REPORT, DIVIDEND)"),
  market: z.string().optional().describe("Filter by market code (e.g. XSTO, FNSE)"),
  limit: z.number().int().min(1).max(200).optional().default(50).describe("Max events to return (default 50, max 200)"),
  offset: z.number().int().min(0).optional().default(0).describe("Number of events to skip"),
});

export type GetReportCalendarArgs = z.infer<typeof getReportCalendarSchema>;

export async function getReportCalendar(
  client: BorsApiClient,
  args: GetReportCalendarArgs
) {
  try {
    const data = await client.get("/api/v1/calendar", {
      from: args.from,
      to: args.to,
      event_type: args.event_type,
      market: args.market,
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
