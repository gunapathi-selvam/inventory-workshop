import type { Config } from "tailwindcss";
import { preset } from "@workshop/ui/preset";

export default {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    // Scan the shared UI package so its component classes are generated.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
