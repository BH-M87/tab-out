# AGENTS.md — Tab Out Setup Instructions for Coding Agents

Tab Out replaces the Chrome new tab page with an AI-powered mission dashboard that groups open tabs into named clusters using any OpenAI-compatible LLM.

This file tells you, the coding agent, exactly how to install it for the user.

---

## What you need to do

### Step 1 — Clone and install dependencies

```bash
git clone https://github.com/zarazhangrui/tab-out.git
cd tab-out
npm install
```

---

### Step 2 — Ask the user which LLM provider they want

Present this choice to the user before proceeding. Do not guess.

```
Which LLM provider do you want to use?

  1. DeepSeek          — Recommended. Cheapest (fractions of a cent per call). Fast.
  2. OpenAI            — GPT-4o-mini. More expensive, very capable.
  3. Claude/Anthropic  — Via OpenRouter. Haiku model (fast and affordable).
  4. Gemini            — Via OpenRouter. Gemini 2.0 Flash.
  5. Groq              — Very fast, free tier available.
  6. Kimi/Moonshot     — Chinese provider, competitive pricing.
  7. GLM/Zhipu         — Chinese provider, GLM-4-Flash is free.
  8. Ollama (local)    — Runs entirely on your machine. Free. No API key needed.
```

---

### Step 3 — Ask the user for their API key

Ask the user for their API key for the chosen provider. **Do not ask them to paste it in chat.** Tell them you will write it directly to the config file.

The only exception is Ollama — no API key is needed.

---

### Step 4 — Run the setup script

Use the `--provider` and `--api-key` flags to set up non-interactively:

```bash
node scripts/setup-interactive.js --provider=<choice> --api-key=<their-key>
```

**Provider values and corresponding config:**

| `--provider` | `baseUrl` | `model` | Notes |
|---|---|---|---|
| `deepseek` | `https://api.deepseek.com` | `deepseek-chat` | Recommended |
| `openai` | `https://api.openai.com/v1` | `gpt-4o-mini` | |
| `claude` | `https://openrouter.ai/api/v1` | `anthropic/claude-3.5-haiku` | Via OpenRouter |
| `gemini` | `https://openrouter.ai/api/v1` | `google/gemini-2.0-flash-001` | Via OpenRouter |
| `groq` | `https://api.groq.com/openai/v1` | `llama-3.1-8b-instant` | |
| `kimi` | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` | |
| `glm` | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | |
| `ollama` | `http://localhost:11434/v1` | `llama3` | No API key needed |

For Ollama, omit `--api-key`:
```bash
node scripts/setup-interactive.js --provider=ollama
```

---

### Step 5 — Custom grouping rules (optional)

Tell the user that `customPromptRules` is available. This is a string appended to the AI clustering prompt that lets the user teach Tab Out personal grouping preferences — for example:

- `"Treat all social media as one mission called 'Doom Scrolling'."`
- `"Group GitHub tabs by repository name."`
- `"I'm a student — group tabs by course/subject."`

If they want to set this, add `--custom-rules="..."` to the setup command:

```bash
node scripts/setup-interactive.js --provider=deepseek --api-key=sk-xxx --custom-rules="Group my GitHub tabs by repo."
```

It can also be edited later in `~/.mission-control/config.json`.

---

### Step 6 — Install the Chrome extension

Open the Chrome extensions page for the user:

```bash
open "chrome://extensions"
```

Then tell the user to:
1. Toggle on **Developer mode** (top-right corner)
2. Click **Load unpacked**
3. Select the `extension/` folder inside the cloned repo

---

### Step 7 — Start the server and verify

```bash
npm start
```

Then open the dashboard to verify it's running:

```bash
open "http://localhost:3456"
```

If the server is running and the dashboard loads, installation is complete.

---

## Key facts

- Config lives at `~/.mission-control/config.json`
- Logs live at `~/.mission-control/logs/`
- The server runs on port `3456` by default
- A macOS Launch Agent is installed so the server starts automatically on login
- Browsing data never leaves the user's machine — the AI call sends only tab titles and URLs
- Legacy config keys (`deepseekApiKey`, `deepseekBaseUrl`, `deepseekModel`) still work for backward compatibility
