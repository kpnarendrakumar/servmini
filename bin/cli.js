#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { fileURLToPath } from "url";
import { scanRoutes } from "../lib/scanner.js";
import { transformToServerless } from "../lib/transformer.js";
import figlet from "figlet";
import { instagram } from "gradient-string";
import dotenv from "dotenv";

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
  .description("Transform Node.js Express apps to Serverless functions")
  .version("0.1.0")
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
  .option("--review", "Enable AI review mode", false)
  .action(async (inputDir, options) => {
    const absPath = path.resolve(process.cwd(), inputDir);
    const files = await scanRoutes(absPath);

    console.log(`🔍 Found ${files.length} files in ${absPath}`);

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

    for (const file of files) {
      await transformToServerless(
        file,
        options.target,
        options.review,
        aiOptions
      );
    }

    console.log("✅ Conversion complete.");
  });

program.parse();
