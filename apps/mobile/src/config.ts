/**
 * Runtime configuration (non-UI). The only knob is the API base URL of the
 * Next.js web app that hosts the shared tRPC endpoint.
 *
 * Priority: EXPO_PUBLIC_API_URL env var → app.json `extra.apiUrl` → localhost.
 * On a physical device, set EXPO_PUBLIC_API_URL to your machine's LAN IP
 * (e.g. http://192.168.1.20:3000) — "localhost" points at the phone itself.
 */
import Constants from "expo-constants";

const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? fromExtra ?? "http://localhost:3000";

export const TRPC_URL = `${API_URL.replace(/\/$/, "")}/api/trpc`;
