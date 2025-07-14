import fetch from "node-fetch";

export async function runOllamaReview({ codeBefore, codeAfter, config }) {
  const model = config.model || "codellama";
  const url = "http://localhost:11434/api/chat";

  const prompt =
    config.promptTemplate ||
    `
Compare the two JavaScript code snippets. Provide a technical review:
- Highlight missing features
- Suggest improvements
- Note any bugs

--- ORIGINAL ---
${codeBefore}

--- CONVERTED ---
${codeAfter}
`;

  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    stream: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`❌ Ollama error: ${errorText}`);
  }

  const json = await res.json();
  return json.message.content.trim();
}
