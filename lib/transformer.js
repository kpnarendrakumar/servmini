import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parse } from "@babel/parser";
import * as recast from "recast";
import prettier from "prettier";
import { runAIReview } from "./ai/index.js";

const b = recast.types.builders;
const skippedFiles = [];

function toESM(code) {
  return code
    .replace(/const (.*?) = require\((.*?)\);?/g, (_, v, lib) => {
      const libPath = lib.replace(/['"]/g, "");
      return `import ${v} from ${JSON.stringify(libPath)};`;
    })
    .replace(/module\.exports\s*=\s*/, "export default ");
}

export async function transformToServerless(
  dirPath,
  target = "vercel",
  review = false,
  aiOptions = {},
  config = {}
) {
  const files = await collectJsFiles(dirPath);
  const baseOutputDir = target === "vercel" ? "output/api" : "output";

  const allOutputs = [];

  for (const filePath of files) {
    const relative = path.relative(process.cwd(), filePath);
    const ext = path.extname(filePath);
    const routePath = relative.replace(/\.(js|ts|tsx)$/, "");
    const original = await fs.readFile(filePath, "utf-8");

    let ast;
    try {
      ast = recast.parse(original, {
        parser: {
          parse(source) {
            return parse(source, {
              sourceType: "module",
              plugins: [
                "jsx",
                "typescript",
                "classProperties",
                "dynamicImport",
              ],
            });
          },
        },
      });
    } catch (err) {
      skippedFiles.push({ file: routePath, reason: err.message });
      continue;
    }

    const fns = [];

    recast.types.visit(ast, {
      visitCallExpression(path) {
        const { node } = path;
        const isRoute =
          node.callee?.object?.name === "router" ||
          node.callee?.object?.name === "app";

        const validMethod = ["get", "post", "put", "delete"].includes(
          node.callee?.property?.name
        );

        if (isRoute && validMethod && node.arguments.length >= 2) {
          const method = node.callee.property.name.toUpperCase();
          const handler = node.arguments.at(-1);

          if (!handler || !handler.body) {
            skippedFiles.push({
              file: routePath,
              reason: `Invalid handler for route method "${method}"`,
            });
            return false;
          }

          const body =
            handler.body.type === "BlockStatement"
              ? handler.body
              : b.blockStatement([b.expressionStatement(handler.body)]);

          const fnAST = b.program([
            b.exportDefaultDeclaration(
              b.functionDeclaration(
                b.identifier("handler"),
                [b.identifier("req"), b.identifier("res")],
                b.blockStatement([
                  b.ifStatement(
                    b.binaryExpression(
                      "===",
                      b.memberExpression(
                        b.identifier("req"),
                        b.identifier("method")
                      ),
                      b.stringLiteral(method)
                    ),
                    body
                  ),
                ])
              )
            ),
          ]);

          fns.push({ routePath, ast: fnAST });
        }

        this.traverse(path);
      },
    });

    for (const fn of fns) {
      const rawCode = recast.print(fn.ast).code;
      let formatted = await prettier.format(rawCode, { parser: "babel" });

      if (config.outTs) formatted = toESM(formatted);

      const outputDir = path.join(process.cwd(), baseOutputDir, fn.routePath);
      await fs.mkdir(path.dirname(outputDir), { recursive: true });

      const ext = config.outTs ? ".ts" : ".js";
      const outputPath = outputDir + ext;
      await fs.writeFile(outputPath, formatted);

      console.log(
        chalk.green(`✔️  Created: ${path.relative(process.cwd(), outputPath)}`)
      );
      allOutputs.push(outputPath);

      if (review && aiOptions?.apiKey) {
        const feedback = await runAIReview({
          codeBefore: original,
          codeAfter: formatted,
          config: aiOptions,
        });

        if (aiOptions.saveReview) {
          const reviewPath = outputPath.replace(ext, `.review.md`);
          await fs.writeFile(reviewPath, feedback);
        }
      }
    }
  }

  // Summary
  console.log(chalk.cyan(`\n📦 Summary:`));
  console.log(chalk.cyan(`  ✅ ${allOutputs.length} files generated.`));
  if (skippedFiles.length) {
    console.log(chalk.yellow(`  ⚠️ ${skippedFiles.length} files skipped:`));
    skippedFiles.forEach((f) =>
      console.log(chalk.yellow(`    - ${f.file}: ${f.reason}`))
    );
  }
}

// Util
async function collectJsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? collectJsFiles(fullPath) : fullPath;
    })
  );
  return files.flat().filter((f) => /\.(js|ts|tsx)$/.test(f));
}
