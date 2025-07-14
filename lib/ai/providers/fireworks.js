import OpenAI from "openai";

export async function runFireworksReview({ codeBefore, codeAfter, config }) {
  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error("❌ Fireworks API key missing. Pass it with --apikey");
  }

  // ✅ Point OpenAI SDK to Fireworks instead of OpenAI
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.fireworks.ai/inference/v1", // 👈 Fireworks API endpoint
  });

  const prompt =
    config.promptTemplate ||
    `
You are a senior developer reviewing a Node.js Express route being converted into a serverless function.

Give clear, actionable feedback. Mention anything missing or that could break in production.

--- BEFORE ---
${codeBefore}

--- AFTER ---
${codeAfter}
`;

  const response = await openai.chat.completions.create({
    model: config.model || "accounts/fireworks/models/deepseek-v3",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
}
