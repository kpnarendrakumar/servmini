import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parse } from "@babel/parser";
import * as recast from "recast";
import prettier from "prettier";
import { runAIReview } from "./ai/index.js";

const b = recast.types.builders;

const statementBody =
  handler.body.type === "BlockStatement"
    ? handler.body
    : b.blockStatement([b.expressionStatement(handler.body)]);

export async function transformToServerless(
  filePath,
  target = "vercel",
  review = false,
  aiOptions = {}
) {
  const originalCode = await fs.readFile(filePath, "utf-8");

  const ast = recast.parse(originalCode, {
    parser: {
      parse(source) {
        return parse(source, {
          sourceType: "module",
          plugins: ["jsx", "typescript", "asyncGenerators", "classProperties"],
        });
      },
    },
  });

  const relativePath = path.relative(process.cwd(), filePath);
  const routePath = relativePath
    .replace(/\\+/g, "/")
    .replace(/\.(ts|tsx|js)$/, "");

  const serverlessFns = [];

  recast.types.visit(ast, {
    visitCallExpression(path) {
      const { node } = path;

      if (
        node.callee?.object?.name === "app" &&
        ["get", "post", "put", "delete"].includes(node.callee.property?.name)
      ) {
        const method = node.callee.property.name.toUpperCase();
        const handler = node.arguments[1];

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
          routePath: routePath,
          ast: b.program([newHandler]),
        });
      }

      this.traverse(path);
    },
  });

  const baseOutputDir = target === "vercel" ? "output/api" : "output";

  for (const fn of serverlessFns) {
    const rawCode = recast.print(fn.ast).code;
    const outputCode = await prettier.format(rawCode, { parser: "babel" });

    const outputDir = path.join(process.cwd(), baseOutputDir, fn.routePath);
    await fs.mkdir(path.dirname(outputDir), { recursive: true });

    const outputPath = outputDir + ".js";
    await fs.writeFile(outputPath, outputCode);
    console.log(
      chalk.green(`✔️  Created: ${path.relative(process.cwd(), outputPath)}`)
    );

    if (review && aiOptions?.apiKey) {
      console.log(chalk.blue(`💬 Running AI review for: ${fn.routePath}.js`));
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
  }
}
