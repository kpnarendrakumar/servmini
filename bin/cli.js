#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { fileURLToPath } from "url";
import { scanRoutes } from "../lib/scanner.js";
import { transformToServerless } from "../lib/transformer.js";
import figlet from "figlet";
import { instagram } from "gradient-string";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const banner = figlet.textSync("ServMini", {
  font: "Standard",
  horizontalLayout: "full",
});
console.log(instagram(banner));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inferProvider = (key) => {
  if (!key) return null;
  if (key.startsWith("sk-or-")) return "openrouter";
  if (key.startsWith("sk-")) return "openai";
  if (key.startsWith("claude-") || key.includes("anthropic")) return "claude";
  if (key.startsWith("fw_")) return "fireworks";
  if (key.startsWith("ollama://")) return "ollama";
  return null;
};

program
  .name("servmini")
  .description("Convert Express route files to Serverless functions")
  .version("1.1.1")
  .argument("<inputDir>", "Path to Express project")
  .option(
    "--target <platform>",
    "Target platform: vercel | netlify | aws",
    "vercel"
  )
  .option("--save-review", "Save AI review as .md file", false)
  .option("--provider <provider>", "AI provider")
  .option("--apikey <key>", "API key")
  .option("--model <model>", "Model to use")
  .option("--prompt <prompt>", "Custom AI prompt")
  .option("--ext <ext>", "Output extension: js | ts", "js")
  .option("--force-ext <ext>", "Force output file extension")
  .option("--review", "Enable AI review mode", false)
  .option("--debug", "Enable debug logs", false)
  .action(async (inputDir, options) => {
    const absPath = path.resolve(process.cwd(), inputDir);
    const files = await scanRoutes(absPath, options.debug);

    const aiOptions = {
      provider:
        options.provider ||
        inferProvider(options.apikey) ||
        process.env.AI_PROVIDER,
      apiKey: options.apikey || process.env.AI_API_KEY,
      model: options.model || process.env.AI_MODEL,
      promptTemplate: options.prompt,
      saveReview: options.saveReview,
    };

    let totalConverted = 0;
    let totalSkipped = [];

    for (const file of files) {
      const result = await transformToServerless(
        file,
        options.target,
        options.review,
        aiOptions,
        options.forceExt,
        options.debug
      );
      totalConverted += result.converted;
      totalSkipped.push(...result.skipped);
    }

    console.log(chalk.cyan(`\n📦 Summary:`));
    console.log(chalk.green(`✅ Converted: ${totalConverted} file(s)`));
    console.log(chalk.yellow(`⚠️  Skipped: ${totalSkipped.length} file(s)`));

    for (const skip of totalSkipped) {
      console.log(chalk.dim(`- ${skip.file}: ${skip.reason}`));
    }

    console.log(`🔍 Found ${files.length} files in ${absPath}`);
    console.log("✅ Conversion complete.");
  });

program.parse();
