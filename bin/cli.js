#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { instagram } from "gradient-string";

import { scanRoutes } from "../lib/scanner.js";
import { transformToServerless } from "../lib/transformer.js";

dotenv.config();

const banner = figlet.textSync("ServMini", {
  font: "Standard",
  horizontalLayout: "full",
});
console.log(instagram(banner));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name("servmini")
  .description("Convert Express route files to Serverless functions")
  .version("1.2.11")
  .argument("<inputDir>", "Path to Express project")
  .option(
    "--target <platform>",
    "Target platform (vercel/netlify/aws)",
    "vercel"
  )
  .option("--debug", "Enable debug output", false)
  .option("--force-ext <ext>", "Force output file extension", "js")
  .action(async (inputDir, options) => {
    const absPath = path.resolve(process.cwd(), inputDir);
    const files = await scanRoutes(absPath, options.debug);

    let totalConverted = 0;
    let totalSkipped = [];

    for (const file of files) {
      const result = await transformToServerless(
        file,
        options.target,
        false, // review mode disabled
        {}, // no AI config
        options.forceExt,
        options.debug
      );
      totalConverted += result.converted;
      totalSkipped.push(...result.skipped);
    }

    console.log(chalk.cyan(`\n📦 Summary:`));
    console.log(chalk.green(`✅ Converted: ${totalConverted}`));
    console.log(chalk.yellow(`⚠️ Skipped: ${totalSkipped.length}`));
    for (const skip of totalSkipped) {
      console.log(chalk.dim(`- ${skip.file}: ${skip.reason}`));
    }
  });

program.parse();
