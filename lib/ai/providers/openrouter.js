import OpenAI from "openai";

export async function runOpenRouterReview({ codeBefore, codeAfter, config }) {
  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error("❌ OpenRouter API key missing. Use --apikey");
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1", // ✅ OpenRouter base URL
    defaultHeaders: {
      "HTTP-Referer": "https://servmini.ai", // optional: set your own domain
      "X-Title": "ServMini AI Reviewer", // optional: custom title
    },
  });

  const prompt =
    config.promptTemplate ||
    `
You're a senior backend developer reviewing Express code converted into a serverless function.

Give helpful, honest, and actionable feedback. Point out bugs, improvements, or best practices.

--- BEFORE ---
${codeBefore}

--- AFTER ---
${codeAfter}
`;

  const response = await openai.chat.completions.create({
    model: config.model || "deepseek/deepseek-r1-0528:free", // ✅ Default to a popular model
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
}
