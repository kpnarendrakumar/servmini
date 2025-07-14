Here is your complete, **production-ready `README.md` file** in Markdown format for the `ServMini` project:

---

````markdown
# 🚀 ServMini

> Convert your Express.js apps into serverless-ready functions (for Vercel, Netlify, AWS, etc.) with optional AI code reviews.

---

![Banner](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E=18.x-green)

---

## 🌟 Overview

**ServMini** transforms traditional Express.js applications (with routes, controllers, middleware, etc.) into **platform-ready serverless functions**. Perfect for modern deployment platforms like **Vercel**, **Netlify**, or **AWS Lambda**.

---

## ✅ Key Features

- 🧠 **AI-powered code review** (OpenAI, Claude, DeepSeek, Ollama, OpenRouter)
- 🔧 Converts `routes/*.js` + `controllers/*.js` pattern
- 📂 Preserves folder structure and relative imports
- 🎯 Targets: Vercel, Netlify, AWS
- 🧪 Supports `.js`, `.ts`, `.tsx`
- 📦 Global CLI (`servmini`)
- 📑 Save AI review as `.md`
- 🔍 Auto-detect AI provider from API key
- 🧬 Automatically scans and transforms all route files

---

## 📦 Installation

### Global (Recommended)

```bash
npm install -g servmini
```
````

Or from local dev folder:

```bash
git clone https://github.com/kpnarendrakumar/servmini.git
cd servmini
npm install
npm link  # 👈 Makes it globally available as `servmini`
```

---

## 🚀 Usage

### CLI Command

```bash
servmini <inputDir> [options]
```

### Example

```bash
servmini ./backend --target vercel --review --apikey sk-or-... --save-review
```

---

## ⚙️ Options

| Flag            | Description                                   | Default      |
| --------------- | --------------------------------------------- | ------------ |
| `--target`      | Deployment target: `vercel`, `netlify`, `aws` | `vercel`     |
| `--review`      | Enable AI review of converted code            | `false`      |
| `--apikey`      | API key for selected AI provider              | Uses `.env`  |
| `--provider`    | Optional provider override                    | Auto-detects |
| `--model`       | Model to use (e.g., `deepseek/deepseek-r1`)   | Auto         |
| `--prompt`      | Custom prompt for AI feedback                 | Predefined   |
| `--save-review` | Save AI feedback as `.md` file                | `false`      |

---

## 📁 Output Structure

### For `--target vercel`:

```
output/
└── api/
    ├── hello.js
    └── submit.js
```

### For `--target netlify`:

```
output/
├── hello.js
└── submit.js
```

---

## 📄 .env Example

Create a `.env` file in the root directory to avoid passing credentials every time:

```env
AI_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_PROVIDER=openrouter
AI_MODEL=deepseek/deepseek-r1-0528:free
```

---

## 💻 Dev Workflow

1. Clone and install dependencies:

```bash
git clone https://github.com/kpnarendrakumar/servmini.git
cd servmini
npm install
```

2. Test locally:

```bash
node ./bin/cli.js ./test --target vercel
```

3. Link to make CLI available globally:

```bash
npm link
servmini ./test --review
```

---

## 🧠 AI Review Setup

### Supported Providers:

| Provider   | Key Prefix               | Example Model                        |
| ---------- | ------------------------ | ------------------------------------ |
| OpenAI     | `sk-`                    | `gpt-4`                              |
| OpenRouter | `sk-or-`                 | `deepseek/deepseek-r1-0528:free`     |
| Claude     | `claude-` or `anthropic` | `claude-3-opus`                      |
| Fireworks  | `fw_`                    | `accounts/fireworks/models/llama-v2` |
| Ollama     | `ollama://`              | `ollama://mistral`                   |

> You can skip AI review by omitting `--review`.

---

## 🧪 Testing

### Sample Express App:

```js
// test/app.js
import express from "express";
const app = express();

app.get("/hello", (req, res) => res.send("Hello from Express!"));
app.post("/submit", (req, res) => res.json({ received: true }));

export default app;
```

### Run CLI:

```bash
servmini ./test --target vercel --review --apikey sk-or-xxx
```

---

## 🛠️ Roadmap / Future Ideas

- [ ] GUI wrapper for non-devs
- [ ] Plugin system for custom transformers
- [ ] Auto-deploy to Vercel/Netlify from CLI
- [ ] GitHub Action Integration
- [ ] Diff view of before/after code

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch:
   `git checkout -b feature/awesome-thing`
3. Commit your changes:
   `git commit -m 'Add awesome feature'`
4. Push and open a Pull Request 🎉

---

## 📄 License

MIT License © KP Narendra Kumar

---

## ✨ Author

**ServMini** was built with ❤️ to make Express-to-Serverless conversion instant, intelligent, and seamless.

> Built by KP Narendra Kumar(https://github.com/kpnarendrakumar)
