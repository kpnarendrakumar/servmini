import fs from "fs/promises";
import path from "path";

export async function scanRoutes(dir, debug = false) {
  let results = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith("Routes.js")) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  if (debug) console.log(`🗂️  Matched files: ${results.length}`);
  return results;
}
