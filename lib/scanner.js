import fg from "fast-glob";
import path from "path";

export async function scanRoutes(inputDir) {
  const patterns = ["**/*.js", "**/*.ts", "**/*.tsx"];
  const files = await fg(patterns, { cwd: inputDir, absolute: true });
  return files;
}
