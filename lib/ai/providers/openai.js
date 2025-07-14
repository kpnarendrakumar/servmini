import OpenAI from "openai";

export async function runOpenAIReview({ codeBefore, codeAfter, config }) {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "❌ Missing API key. Use --apikey or set OPENAI_API_KEY in .env"
    );
  }

  // ✅ Pass it directly and explicitly this way
  const openai = new OpenAI({
    apiKey: apiKey,
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

  const completion = await openai.chat.completions.create({
    model: config.model || "gpt-3.5-turbo",

    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content.trim();
}
