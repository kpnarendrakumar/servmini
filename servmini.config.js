export default {
  ai: {
    provider: "openrouter",
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: "deepseek/deepseek-r1-0528:free",
    promptTemplate:
      "Summarize the following Express-to-Serverless transformation:",
  },
};
