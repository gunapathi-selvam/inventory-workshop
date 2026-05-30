/** Client-safe exports: only types + the transformer. Importing this file pulls
 *  in NO server code, so it is safe for the web app and the future mobile app. */
export type { AppRouter } from "./root.js";
export { default as transformer } from "superjson";
