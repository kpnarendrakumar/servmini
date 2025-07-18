import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parse } from "@babel/parser";
import * as recast from "recast";
import prettier from "prettier";
import { runAIReview } from "./ai/index.js";

const b = recast.types.builders;

const pluginOptions = [
  "jsx",
  "typescript",
  "classProperties",
  "dynamicImport",
  "topLevelAwait",
];

const isRouteCall = (node) => {
  const obj = node.callee?.object;
  const method = node.callee?.property?.name;
  const validObj = obj?.name === "app" || obj?.name === "router";
  const validMethod = ["get", "post", "put", "delete"].includes(method);
  return validObj && validMethod;
};

const toESM = (code) =>
  code
    .replace(/const\s+\w+\s+=\s+require\(([^)]+)\);?/g, (_, mod) => {
      const name = mod.replace(/['"]/g, "").split("/").pop();
      return `import ${name} from ${mod};`;
    })
    .replace(/module\.exports\s*=\s*(\w+)/g, "export default $1");

export async function transformToServerless(
  filePath,
  target = "vercel",
  review = false,
  aiOptions = {},
  forceExt = "js"
) {
  const originalCodeRaw = await fs.readFile(filePath, "utf-8");

  const routePath = path
    .relative(process.cwd(), filePath)
    .replace(/\\/g, "/")
    .replace(/\.(js|ts|tsx)$/, "");

  let originalCode = originalCodeRaw;
  if (forceExt === "ts") {
    originalCode = toESM(originalCodeRaw);
  }

  let ast;
  try {
    ast = recast.parse(originalCode, {
      parser: {
        parse(source) {
          return parse(source, {
            sourceType: "module",
            plugins: pluginOptions,
          });
        },
      },
    });
  } catch (err) {
    return {
      converted: 0,
      skipped: [{ file: filePath, reason: `Parse error: ${err.message}` }],
    };
  }

  const serverlessFns = [];
  let validRouteFound = false;

  recast.types.visit(ast, {
    visitCallExpression(path) {
      const { node } = path;

      if (isRouteCall(node)) {
        validRouteFound = true;

        const method = node.callee.property.name.toUpperCase();
        const handler = node.arguments[1];

        if (!handler || !handler.body) {
          serverlessFns.push({
            error: `Invalid handler (no body)`,
            routePath,
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
      }

      this.traverse(path);
    },
  });

  // No route handler like app.get or router.post
  if (!validRouteFound) {
    return {
      converted: 0,
      skipped: [{ file: filePath, reason: "No route handlers found" }],
    };
  }

  const baseOutputDir = target === "vercel" ? "output/api" : "output";
  const outputExt = forceExt ? `.${forceExt}` : ".js";
  const skipped = [];
  let converted = 0;

  for (const fn of serverlessFns) {
    if (fn.error) {
      skipped.push({ file: filePath, reason: fn.error });
      continue;
    }

    try {
      const rawCode = recast.print(fn.ast).code;
      const outputCode = await prettier.format(rawCode, { parser: "babel" });

      const outputDir = path.join(process.cwd(), baseOutputDir, fn.routePath);
      await fs.mkdir(path.dirname(outputDir), { recursive: true });

      const outputPath = `${outputDir}${outputExt}`;
      await fs.writeFile(outputPath, outputCode);
      console.log(
        chalk.green(`✔️  Created: ${path.relative(process.cwd(), outputPath)}`)
      );
      converted++;

      if (review && aiOptions?.apiKey) {
        console.log(chalk.blue(`💬 Running AI review for: ${fn.routePath}`));
        const feedback = await runAIReview({
          codeBefore: originalCodeRaw,
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
    } catch (err) {
      skipped.push({
        file: filePath,
        reason: `Write error: ${err.message}`,
      });
    }
  }

  return { converted, skipped };
}
