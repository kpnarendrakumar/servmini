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

const banner = figlet.textSync("ServMini", { font: "Standard" });
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
  .description("Transform Node.js Express apps to Serverless functions")
  .version("1.2.7")
  .argument("<inputDir>", "Path to your Express server directory")
  .option(
    "--target <platform>",
    "Target platform: vercel | netlify | aws",
    "vercel"
  )
  .option("--save-review", "Save AI review as .md next to output", false)
  .option("--provider <provider>", "AI provider to use for --review")
  .option("--apikey <key>", "API key for the selected AI provider")
  .option("--model <model>", "Model to use with selected AI provider")
  .option("--prompt <prompt>", "Custom prompt template for AI")
  .option("--ext <ext>", "Output file extension: js | ts", "js")
  .option("--force-ext <ext>", "Force output file extension: .js | .ts | .tsx")
  .option("--review", "Enable AI review mode", false)
  .action(async (inputDir, options) => {
    const absPath = path.resolve(process.cwd(), inputDir);
    const files = await scanRoutes(absPath);

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
        options.forceExt || options.ext
      );
      totalConverted += result.converted;
      totalSkipped.push(...result.skipped);
    }

    // Final Summary
    console.log(chalk.cyan(`\n📦 Summary:`));
    console.log(chalk.green(`✅ Converted: ${totalConverted} file(s)`));
    console.log(chalk.yellow(`⚠️  Skipped: ${totalSkipped.length} file(s)`));

    if (totalSkipped.length > 0) {
      for (const skip of totalSkipped) {
        console.log(chalk.dim(`- ${skip.file}: ${skip.reason}`));
      }
    }

    console.log(`🔍 Found ${files.length} files in ${absPath}`);
    console.log("✅ Conversion complete.");
  });

program.parse();
