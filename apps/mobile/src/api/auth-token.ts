/**
 * In-memory holder for the current bearer token. The tRPC link reads it at
 * request time (so it always sends the latest token) while the AuthProvider
 * owns persistence. Decoupling them avoids a provider ordering cycle.
 */
let current: string | null = null;

export const authToken = {
  get: (): string | null => current,
  set: (token: string | null): void => {
    current = token;
  },
};
