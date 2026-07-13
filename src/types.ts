export interface ApiErrorBody {
  error?: string;
  code?: string;
}

export class BorsApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "BorsApiError";
    this.status = status;
    this.code = code;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined>;
