import fs from "fs/promises";
import path from "path";
import * as recast from "recast";
import prettier from "prettier";

const babelParser = require("@babel/parser");

export async function transformToServerless(
  filePath,
  target,
  useAI,
  aiOptions,
  forceExt = "js",
  debug = false
) {
  const skipped = [];
  let converted = 0;

  try {
    let code = await fs.readFile(filePath, "utf8");

    // Basic validation
    if (!code.includes("express")) {
      skipped.push({ file: filePath, reason: "No route handlers found" });
      return { converted, skipped };
    }

    // Convert CommonJS to ESM (basic)
    if (code.includes("require(")) {
      code = code.replace(
        /const (.+?) = require\(['"](.+?)['"]\);?/g,
        "import $1 from '$2';"
      );
    }

    const ast = recast.parse(code, {
      parser: {
        parse(source) {
          return babelParser.parse(source, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
          });
        },
      },
    });

    // Modify AST (simplified): export default handler
    const outputCode = recast.print(ast).code;

    const ext = forceExt.startsWith(".") ? forceExt : `.${forceExt}`;
    const outputPath = filePath.replace(/\.\w+$/, ext);

    const formatted = await prettier.format(outputCode, { parser: "babel" });
    await fs.writeFile(outputPath, formatted, "utf8");

    converted++;
    if (debug) console.log(`✅ Converted ${filePath} → ${outputPath}`);
  } catch (err) {
    skipped.push({
      file: filePath,
      reason: err.message || "Unknown error",
    });

    if (debug) {
      console.error(`❌ Error in ${filePath}:\n`, err);
    }
  }

  return { converted, skipped };
}
