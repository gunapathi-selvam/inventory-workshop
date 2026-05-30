/**
 * Normalize any thrown value (tRPC client errors carry the server's normalized
 * AppError under data.appError) into a user-facing message string.
 */
export function toErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (!err) return fallback;
  const e = err as { data?: { appError?: { message?: string } }; message?: string };
  return e.data?.appError?.message ?? e.message ?? fallback;
}
