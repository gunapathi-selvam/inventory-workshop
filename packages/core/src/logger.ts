/**
 * Minimal structured logger. Swappable for pino/winston later without changing
 * call sites. All server-side logging flows through here.
 */
type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel(): Level {
  const fromEnv = (process.env.LOG_LEVEL as Level) || "info";
  return order[fromEnv] ? fromEnv : "info";
}

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (order[level] < order[currentLevel()]) return;
  const entry = { ts: new Date().toISOString(), level, msg, ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
