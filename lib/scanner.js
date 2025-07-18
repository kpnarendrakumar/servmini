import { globby } from "globby";
import path from "path";
import fs from "fs";

export async function scanRoutes(baseDir, debug = false) {
  const patterns = [
    "**/*Routes.js",
    "**/*Routes.ts",
    "**/*Routes.tsx",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ];

  const entries = await globby(patterns, { cwd: baseDir, absolute: true });

  if (debug) {
    console.log(
      `🔍 Scanned route files:\n`,
      entries.map((e) => `- ${e}`).join("\n")
    );
  }

  return entries.filter((f) => fs.existsSync(f));
}
