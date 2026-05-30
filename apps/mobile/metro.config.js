/**
 * Metro config tuned for this pnpm + Turborepo monorepo.
 *
 * Metro must watch the repo root (so changes in packages/* hot-reload) and be
 * told about both the app's and the root's node_modules.
 *
 * The shared workspace packages are authored as ESM TypeScript with explicit
 * `.js` import specifiers (e.g. `export * from "./errors.js"`) — valid for tsc
 * and Next.js, but Metro doesn't rewrite `.js` → `.ts`. The custom resolver
 * below maps a failing relative `.js` import to its TypeScript source.
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// Resolve relative `*.js` specifiers in our TS-source workspace packages to the
// real `.ts`/`.tsx` files. Try the original first; on failure, retry without
// the extension so Metro's sourceExts (ts, tsx, …) can match.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isRelative = moduleName.startsWith("./") || moduleName.startsWith("../");
  if (isRelative && moduleName.endsWith(".js")) {
    try {
      return context.resolveRequest(context, moduleName.replace(/\.js$/, ""), platform);
    } catch {
      // fall through to the default resolution below
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
