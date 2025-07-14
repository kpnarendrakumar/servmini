export async function runAIReview({ codeBefore, codeAfter, config }) {
  const provider = config.provider || "openai";

  if (provider === "openai") {
    const { runOpenAIReview } = await import("./providers/openai.js");
    return await runOpenAIReview({ codeBefore, codeAfter, config });
  }

  if (provider === "openrouter") {
    const { runOpenRouterReview } = await import("./providers/openrouter.js");
    return await runOpenRouterReview({ codeBefore, codeAfter, config });
  }

  if (provider === "claude") {
    const { runClaudeReview } = await import("./providers/claude.js");
    return await runClaudeReview({ codeBefore, codeAfter, config });
  }

  if (provider === "ollama") {
    const { runOllamaReview } = await import("./providers/ollama.js");
    return await runOllamaReview({ codeBefore, codeAfter, config });
  }

  return `⚠️ Unknown AI provider '${provider}'`;
}
