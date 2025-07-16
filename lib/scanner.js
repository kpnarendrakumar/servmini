import { globby } from "globby";
import path from "path";

export async function scanRoutes(inputDir) {
  const patterns = [
    "**/*.js",
    "**/*.ts",
    "**/*.tsx",
    "**/routes/**/*.{js,ts,tsx}",
    "!node_modules/**",
    "!**/*.test.*",
    "!**/__tests__/**",
    "!output/**",
  ];
  return await globby(patterns, { cwd: inputDir, absolute: true });
}
