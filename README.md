🚀 ServMini
ServMini is a powerful CLI tool to transform your Express.js routes into serverless functions (for Vercel, Netlify, or AWS Lambda) — with optional AI-powered code reviews using OpenAI, Claude, Ollama, and more.

✨ Features
✅ Converts routes/\*.js to serverless-ready functions
✅ Supports .js, .ts, .tsx
✅ Targets: Vercel, Netlify, AWS Lambda
✅ Preserves folder structure and relative imports
✅ Optional AI code reviews using OpenAI, Claude, Ollama, OpenRouter
✅ Saves AI feedback as .md (optional)
✅ Auto-detects AI provider based on API key
✅ CLI-friendly and modular
✅ Extensible via plugin architecture (upcoming)

📦 Installation
Global (Recommended)
bash
Copy
Edit
npm install -g servmini
From Source (Local Development)
bash
Copy
Edit
git clone https://github.com/kpnarendrakumar/servmini.git
cd servmini
npm install
npm link
Now you can run it globally using:

bash
Copy
Edit
servmini
🚀 Usage
Basic CLI Command
bash
Copy
Edit
servmini <inputDir> [options]
Example (AI Review Enabled)
bash
Copy
Edit
servmini ./backend \
 --target vercel \
 --review \
 --apikey sk-or-xxxxxxxxxxxxxxxx \
 --save-review \
 --out-dir converted
⚙️ CLI Options
Flag Description Default
--target Deployment target: vercel, netlify, aws vercel
--ext Output file extension: js, ts, tsx js
--force-ext Force file extension override
--out-dir Custom output directory converted/
--review Enable AI code review false
--save-review Save AI feedback to .md file false
--provider AI provider: openai, openrouter, claude, ollama, etc. Auto-detect
--apikey API key for AI provider (can also use .env)
--model Model to use (e.g., gpt-4, deepseek/deepseek-r1) Provider default
--prompt Custom prompt for AI reviewer Predefined
--experimental Use experimental transformer engine (convert.js pipeline) (optional) false
--debug Enable verbose logging false

🧪 Example Express App
js
Copy
Edit
// backend/routes/example.js
import express from 'express';
const router = express.Router();

router.get('/hello', (req, res) => {
res.send('Hello, world!');
});

export default router;
Convert to Vercel Function
bash
Copy
Edit
servmini ./backend --target vercel
📁 Output Example
--target vercel
markdown
Copy
Edit
converted/
└── api/
└── hello.js
--target netlify
Copy
Edit
converted/
└── hello.js
🧠 AI Review Setup
Supported Providers
Provider Key Prefix Example Model
OpenAI sk- gpt-4, gpt-3.5-turbo
OpenRouter sk-or- deepseek/deepseek-r1, mistral
Claude claude- or anthropic claude-3-opus
Fireworks fw\_ accounts/fireworks/models/llama-v2
Ollama ollama:// ollama://mistral

You can skip AI review by omitting --review.

📄 .env Example
Instead of passing keys in CLI:

env
Copy
Edit
AI_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxx
AI_PROVIDER=openrouter
AI_MODEL=deepseek/deepseek-r1-0528:free
🔧 Developer Mode
Test Locally
bash
Copy
Edit
node ./bin/cli.js ./test --target vercel
Link CLI Globally
bash
Copy
Edit
npm link
servmini ./test --review
🧬 Roadmap
Vercel/Netlify/AWS support

AI review with multiple providers

Save .md AI reports

Auto-deploy to Vercel/Netlify

GitHub Action for CI pipelines

Plugin support for custom transformations

GUI version for non-devs

🙌 Contributing
bash
Copy
Edit

# Fork the repo and clone locally

git clone https://github.com/kpnarendrakumar/servmini.git

# Create a branch

git checkout -b feature/awesome-feature

# Make changes and commit

git commit -m "✨ Add awesome feature"

# Push and open PR

git push origin feature/awesome-feature
📜 License
MIT License © 2025 [KP Narendra Kumar]

🌍 Author
KP Narendra Kumar
GitHub: @kpnarendrakumar
Twitter: @narendrakumarkp
