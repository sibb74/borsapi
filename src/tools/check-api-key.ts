import type { BorsApiClient } from "../client.js";
import { formatApiError } from "../client.js";

export async function checkApiKey(client: BorsApiClient) {
  try {
    const data = await client.get("/api/v1/test");
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
