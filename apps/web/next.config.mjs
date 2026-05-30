/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile workspace TS packages directly (no separate build step).
  transpilePackages: [
    "@workshop/api",
    "@workshop/auth",
    "@workshop/core",
    "@workshop/db",
    "@workshop/ui",
    "@workshop/validators",
  ],
  // argon2 + prisma are native/server-only; keep them external to the bundle.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "nodemailer"],
  // Workspace packages are authored in TS using ESM ".js" import specifiers
  // (valid under TS "Bundler" resolution). Teach webpack to resolve those to
  // the real ".ts"/".tsx" source files.
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
