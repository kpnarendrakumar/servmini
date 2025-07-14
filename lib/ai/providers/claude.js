import OpenAI from "openai";

export async function runClaudeReview({ codeBefore, codeAfter, config }) {
  const apiKey = config.apiKey;
  if (!apiKey) throw new Error("❌ Missing OpenRouter API key for Claude");

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://servmini.ai",
      "X-Title": "Claude Review",
    },
  });

  const prompt =
    config.promptTemplate ||
    `
You are Claude, a helpful AI assistant and code reviewer.

Compare the original Express code with the converted serverless code and give structured feedback:
- Bugs
- Logic gaps
- Suggestions
- Improvements

--- BEFORE ---
${codeBefore}

--- AFTER ---
${codeAfter}
`;

  const response = await openai.chat.completions.create({
    model: config.model || "anthropic/claude-3-sonnet",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
}
