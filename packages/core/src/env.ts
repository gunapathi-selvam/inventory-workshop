/**
 * Validated environment access. No secret is read from `process.env` directly
 * anywhere else in the codebase — import `env` from here so a missing/invalid
 * variable fails fast at startup instead of at runtime deep in a request.
 */
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Prisma datasource URL. SQLite now (file:...), Postgres later (postgresql://...). */
  DATABASE_URL: z.string().min(1).default("file:./prisma/dev.db"),

  /** Auth.js session secret. Generate with `openssl rand -base64 32`. */
  AUTH_SECRET: z.string().min(1).default("dev-only-insecure-secret-change-me"),

  /** Public base URL of the web app. */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /** SMTP (wired now, used when email is enabled). Mailpit defaults for localhost. */
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Workshop <no-reply@workshop.local>"),
  EMAIL_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const env: Env = new Proxy({} as Env, {
  get(_t, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
