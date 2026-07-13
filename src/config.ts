export interface BorsApiConfig {
  apiKey: string;
  baseUrl: string;
}

export function loadConfig(): BorsApiConfig {
  const apiKey = process.env.BORSAPI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "BORSAPI_API_KEY is required. Get your API key from https://borsapi.se/dashboard and set it in your MCP client config."
    );
  }

  const baseUrl = (process.env.BORSAPI_BASE_URL ?? "https://borsapi.se").replace(/\/$/, "");

  return { apiKey, baseUrl };
}
