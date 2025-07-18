/**
 * Wraps Express route code into a serverless-compatible format
 * for Vercel, Netlify, or AWS Lambda
 */
export function transformRouteToServerless(code, target = "vercel") {
  switch (target.toLowerCase()) {
    case "vercel":
      return vercelWrapper(code);
    case "netlify":
      return netlifyWrapper(code);
    case "aws":
    case "aws-lambda":
      return awsWrapper(code);
    default:
      throw new Error(`Unsupported target platform: ${target}`);
  }
}

function vercelWrapper(code) {
  return `
import express from "express";
import { createServerlessHandler } from "vercel-express";

const app = express();

${code}

export default createServerlessHandler(app);
`.trim();
}

function netlifyWrapper(code) {
  return `
import express from "express";
import serverless from "serverless-http";

const app = express();
const router = express.Router();

${code}

app.use("/.netlify/functions/index", router);

export const handler = serverless(app);
`.trim();
}

function awsWrapper(code) {
  return `
import express from "express";
import awsServerlessExpress from "aws-serverless-express";

const app = express();

${code}

const server = awsServerlessExpress.createServer(app);

export const handler = (event, context) => {
  return awsServerlessExpress.proxy(server, event, context);
};
`.trim();
}
