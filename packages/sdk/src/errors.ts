export type DataStorifiedErrorCode = "offline" | "unauthorized" | "network" | "http" | "parse" | "unknown";

export class DataStorifiedError extends Error {
  constructor(
    public readonly code: DataStorifiedErrorCode,
    message: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DataStorifiedError";
  }
}

export class OfflineError extends DataStorifiedError {
  constructor(message = "You appear to be offline.") {
    super("offline", message);
    this.name = "OfflineError";
  }
}

export class UnauthorizedError extends DataStorifiedError {
  constructor(message = "Please sign in to continue.", details?: unknown) {
    super("unauthorized", message, 401, details);
    this.name = "UnauthorizedError";
  }
}

export class HttpError extends DataStorifiedError {
  constructor(status: number, message = "Request failed.", details?: unknown) {
    super("http", message, status, details);
    this.name = "HttpError";
  }
}

export class NetworkError extends DataStorifiedError {
  constructor(message = "Network request failed.", details?: unknown) {
    super("network", message, undefined, details);
    this.name = "NetworkError";
  }
}

export class ParseError extends DataStorifiedError {
  constructor(message = "Unable to parse server response.", details?: unknown) {
    super("parse", message, undefined, details);
    this.name = "ParseError";
  }
}

export function isDataStorifiedError(error: unknown): error is DataStorifiedError {
  return error instanceof Error && "code" in error;
}
