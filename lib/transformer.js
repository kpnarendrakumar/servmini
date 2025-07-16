import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parse } from "@babel/parser";
import * as recast from "recast";
import prettier from "prettier";
import { runAIReview } from "./ai/index.js";

const b = recast.types.builders;

function isExpressRouteCall(node) {
  return (
    node.callee?.object?.name === "app" &&
    ["get", "post", "put", "delete"].includes(node.callee.property?.name)
  );
}

function convertCommonJSToESM(code) {
  return code
    .replace(/const (\w+) = require\(['"](.+)['"]\);?/g, "import $1 from '$2';")
    .replace(/module\.exports\s*=\s*/, "export default ");
}

export async function transformToServerless(
  filePath,
  target = "vercel",
  review = false,
  aiOptions = {},
  outputExt = "js"
) {
  const skipped = [];
  const converted = [];

  let originalCode = await fs.readFile(filePath, "utf-8");

  // Auto-convert require/module.exports if .ts/.tsx
  if (["ts", "tsx"].includes(outputExt)) {
    originalCode = convertCommonJSToESM(originalCode);
  }

  let ast;
  try {
    ast = recast.parse(originalCode, {
      parser: {
        parse(source) {
          return parse(source, {
            sourceType: "module",
            plugins: [
              "jsx",
              "typescript",
              "asyncGenerators",
              "classProperties",
            ],
          });
        },
      },
    });
  } catch (err) {
    skipped.push({
      file: filePath,
      reason: "Parse error: " + err.message,
    });
    return { converted: 0, skipped };
  }

  const relativePath = path.relative(process.cwd(), filePath);
  const routePath = relativePath
    .replace(/\\+/g, "/")
    .replace(/\.(ts|tsx|js)$/, "");

  let transformed = false;

  const serverlessFns = [];

  recast.types.visit(ast, {
    visitCallExpression(path) {
      const { node } = path;

      if (isExpressRouteCall(node)) {
        const method = node.callee.property.name.toUpperCase();
        const handler = node.arguments[1];

        if (!handler || !handler.body) {
          skipped.push({
            file: filePath,
            reason: "Invalid handler (no body)",
          });
          return false;
        }

        const statementBody =
          handler.body.type === "BlockStatement"
            ? handler.body
            : b.blockStatement([b.expressionStatement(handler.body)]);

        const newHandler = b.exportDefaultDeclaration(
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
                statementBody
              ),
            ])
          )
        );

        serverlessFns.push({
          routePath,
          ast: b.program([newHandler]),
        });

        transformed = true;
      }

      this.traverse(path);
    },
  });

  const baseOutputDir = target === "vercel" ? "output/api" : "output";

  if (serverlessFns.length === 0) {
    skipped.push({ file: filePath, reason: "No route handlers found" });
    return { converted: 0, skipped };
  }

  for (const fn of serverlessFns) {
    const rawCode = recast.print(fn.ast).code;
    const outputCode = await prettier.format(rawCode, { parser: "babel" });

    const outputDir = path.join(process.cwd(), baseOutputDir, fn.routePath);
    await fs.mkdir(path.dirname(outputDir), { recursive: true });

    const outputPath = outputDir + `.${outputExt}`;
    await fs.writeFile(outputPath, outputCode);
    console.log(
      chalk.green(`✔️  Created: ${path.relative(process.cwd(), outputPath)}`)
    );

    if (review && aiOptions?.apiKey) {
      console.log(
        chalk.blue(`💬 Running AI review for: ${fn.routePath}.${outputExt}`)
      );
      const feedback = await runAIReview({
        codeBefore: originalCode,
        codeAfter: outputCode,
        config: aiOptions,
      });
      console.log(chalk.yellowBright(`🧠 AI Feedback:\n${feedback}\n`));

      if (aiOptions.saveReview) {
        const reviewPath = path.join(
          process.cwd(),
          "output",
          `${fn.routePath}.review.md`
        );
        await fs.writeFile(reviewPath, feedback);
        console.log(chalk.blue(`📝 Saved review: ${fn.routePath}.review.md`));
      }
    }

    converted.push(filePath);
  }

  return {
    converted: converted.length,
    skipped,
  };
}
