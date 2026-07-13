import type { BorsApiConfig } from "./config.js";
import { BorsApiError, type ApiErrorBody, type QueryParams } from "./types.js";

export interface BorsApiClientOptions {
  fetchImpl?: typeof fetch;
}

export class BorsApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly config: BorsApiConfig,
    options: BorsApiClientOptions = {}
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async get<T>(path: string, params?: QueryParams, requireAuth = true): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "borsapi-mcp-server/1.0.1",
    };

    if (requireAuth) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const response = await this.fetchImpl(url.toString(), { headers });
    const text = await response.text();

    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const errorBody = (body ?? {}) as ApiErrorBody;
      const message = errorBody.error ?? `Request failed with status ${response.status}`;
      throw new BorsApiError(response.status, message, errorBody.code);
    }

    return body as T;
  }
}

export function formatApiError(error: unknown): string {
  if (error instanceof BorsApiError) {
    if (error.status === 401) {
      return "Invalid API key. Verify BORSAPI_API_KEY in your MCP config and generate a key at https://borsapi.se/dashboard";
    }

    if (error.status === 404) {
      return `Not found: ${error.message}`;
    }

    if (error.status === 429) {
      return `Rate limit exceeded: ${error.message}. MCP calls use the same quota as REST API calls. Use check_api_key to inspect remaining quota.`;
    }

    if (error.status >= 500) {
      return `BörsAPI server error (${error.status}): ${error.message}`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error while calling BörsAPI";
}
