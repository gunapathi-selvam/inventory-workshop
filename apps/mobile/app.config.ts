import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config. Everything static lives in app.json; this layer adds the
 * `expo-build-properties` plugin and enables Android cleartext (plain http)
 * traffic ONLY when the API URL is http:// (local dev). When the build targets
 * an https:// API (production), cleartext is left OFF automatically — so a
 * production build can never ship allowing unencrypted traffic.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    ((config.extra as { apiUrl?: string } | undefined)?.apiUrl ?? "http://localhost:3000");
  const allowCleartext = apiUrl.startsWith("http://");

  return {
    ...config,
    name: config.name ?? "Workshop",
    slug: config.slug ?? "workshop-mobile",
    plugins: [
      ...(config.plugins ?? []),
      ["expo-build-properties", { android: { usesCleartextTraffic: allowCleartext } }],
    ],
  };
};
