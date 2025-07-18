import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transforms Express route files into serverless function format for supported platforms.
 * Supports: vercel, netlify, aws
 */
export async function transformToServerless(
  file,
  target = "vercel",
  reviewMode = false,
  aiOptions = {},
  forceExt = "js",
  debug = false
) {
  const fileName = path.basename(file, path.extname(file));
  const routeDir = path.basename(path.dirname(file)).toLowerCase();
  const outputDir = path.resolve(process.cwd(), "converted");

  const outputPath = path.join(outputDir, `${fileName}.${forceExt}`);

  try {
    const content = await fs.readFile(file, "utf-8");

    // Basic Express handler transformation (very simplified)
    const transformed = content
      .replace(/express\.Router\(\)/g, "handler")
      .replace(/router/g, "export default handler");

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Write the transformed file
    await fs.writeFile(outputPath, transformed);

    if (debug) {
      console.log(`→ Wrote to ${outputPath}`);
    }

    return { converted: 1, skipped: [] };
  } catch (err) {
    if (debug) {
      console.error("❌ Error transforming:", file, "\n", err.message);
    }

    return {
      converted: 0,
      skipped: [{ file, reason: err.message }],
    };
  }
}
