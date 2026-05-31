import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@workshop/auth";
import { appRouter, createContext, createCallerFactory } from "@workshop/api";

const createCaller = createCallerFactory(appRouter);

/** Current session user for server components that need the role/id directly
 *  (e.g. to gate admin-only UI). Cached per render pass. */
export const getServerUser = cache(getCurrentUser);

/**
 * Server-side tRPC caller for React Server Components. Calls the router directly
 * (no HTTP round-trip) with a context resolved from the Auth.js cookie session,
 * so `permissionProcedure`s enforce access exactly as they do over HTTP.
 *
 * `cache()` dedupes the context (one auth + permission resolution) within a
 * single render pass, even if several server components call it.
 */
export const getServerApi = cache(async () => createCaller(await createContext()));
