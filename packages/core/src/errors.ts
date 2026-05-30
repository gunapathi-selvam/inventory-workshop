/**
 * Centralized error module — the single source of truth for application errors.
 *
 * Every domain throws `AppError` (or a helper below). The API layer normalizes
 * anything thrown into an `AppError` via `toAppError()` and the frontend renders
 * it consistently. Add a new failure category by extending `ErrorCode` only.
 */

export const ErrorCode = {
  AUTH: "AUTH",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  STOCK: "STOCK",
  PRICING: "PRICING",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Maps an ErrorCode to an HTTP status, used by REST/route handlers if needed. */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  AUTH: 401,
  FORBIDDEN: 403,
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  STOCK: 409,
  PRICING: 422,
  RATE_LIMIT: 429,
  INTERNAL: 500,
};

export interface AppErrorOptions {
  /** Machine-readable category. */
  code?: ErrorCode;
  /** Optional structured detail surfaced to the client (field errors, ids…). */
  details?: Record<string, unknown>;
  /** Underlying error, kept server-side only (never serialized to client). */
  cause?: unknown;
  /** When false the message is replaced by a generic one before serialization. */
  expose?: boolean;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly expose: boolean;
  override readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? ErrorCode.INTERNAL;
    this.details = options.details;
    this.expose = options.expose ?? this.code !== ErrorCode.INTERNAL;
    this.cause = options.cause;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Client-safe serialization. Hides internal messages unless exposed. */
  toClient() {
    return {
      code: this.code,
      message: this.expose ? this.message : "Something went wrong. Please try again.",
      details: this.expose ? this.details : undefined,
      httpStatus: ERROR_HTTP_STATUS[this.code],
    };
  }
}

/* ------------------------------------------------------------------ */
/* Convenience factory helpers — keep call sites short & consistent.  */
/* ------------------------------------------------------------------ */

export const errors = {
  auth: (message = "Authentication required", details?: Record<string, unknown>) =>
    new AppError(message, { code: ErrorCode.AUTH, details }),
  forbidden: (message = "You do not have permission to do this", details?: Record<string, unknown>) =>
    new AppError(message, { code: ErrorCode.FORBIDDEN, details }),
  validation: (message = "Invalid input", details?: Record<string, unknown>) =>
    new AppError(message, { code: ErrorCode.VALIDATION, details }),
  notFound: (entity = "Resource", details?: Record<string, unknown>) =>
    new AppError(`${entity} not found`, { code: ErrorCode.NOT_FOUND, details }),
  conflict: (message = "Conflict with current state", details?: Record<string, unknown>) =>
    new AppError(message, { code: ErrorCode.CONFLICT, details }),
  stock: (message = "Insufficient stock", details?: Record<string, unknown>) =>
    new AppError(message, { code: ErrorCode.STOCK, details }),
  pricing: (message = "Pricing could not be calculated", details?: Record<string, unknown>) =>
    new AppError(message, { code: ErrorCode.PRICING, details }),
  internal: (message = "Internal error", cause?: unknown) =>
    new AppError(message, { code: ErrorCode.INTERNAL, expose: false, cause }),
};

/** Normalizes any thrown value into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError(err.message, { code: ErrorCode.INTERNAL, expose: false, cause: err });
  }
  return new AppError("Unknown error", { code: ErrorCode.INTERNAL, expose: false, cause: err });
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * Normalize any thrown value into a user-facing message string. tRPC client
 * errors carry the server's normalized AppError under `data.appError`; fall back
 * to `.message`, then a generic message. Used by both the web and mobile UIs.
 */
export function toErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (!err) return fallback;
  const e = err as { data?: { appError?: { message?: string } }; message?: string };
  return e.data?.appError?.message ?? e.message ?? fallback;
}
