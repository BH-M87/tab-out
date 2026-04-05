// scripts/setup-interactive.js
// ─────────────────────────────────────────────────────────────────────────────
// Setup script for Tab Out.
//
// Can be run two ways:
//   1. By a coding agent (non-interactive, with flags):
//        node scripts/setup-interactive.js --provider=deepseek --api-key=sk-xxx
//        node scripts/setup-interactive.js --provider=ollama
//        node scripts/setup-interactive.js --provider=deepseek --api-key=sk-xxx --custom-rules="group github by repo"
//
//   2. By a human (no flags — prints the provider list and exits with instructions)
//
// What it does:
//   1. Checks prerequisites (Node.js version, Chrome history file)
//   2. Creates ~/.mission-control/ directory and logs subdirectory
//   3. Writes config.json with the correct baseUrl and model for the provider
//   4. Installs the macOS Launch Agent (so the server auto-starts on login)
//   5. Prints next steps
// ─────────────────────────────────────────────────────────────────────────────

const fs           = require('fs');
const path         = require('path');
const os           = require('os');
const { execSync } = require('child_process');

// ── Provider definitions ──────────────────────────────────────────────────────
// Each provider has a baseUrl and model. The user supplies their own apiKey.
// Ollama is local so it doesn't need an API key.

const PROVIDERS = {
  deepseek: {
    label:   'DeepSeek (recommended — cheapest)',
    baseUrl: 'https://api.deepseek.com',
    model:   'deepseek-chat',
    needsKey: true,
  },
  openai: {
    label:   'OpenAI (GPT-4o-mini)',
    baseUrl: 'https://api.openai.com/v1',
    model:   'gpt-4o-mini',
    needsKey: true,
  },
  claude: {
    label:   'Claude/Anthropic via OpenRouter (claude-3.5-haiku)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model:   'anthropic/claude-3.5-haiku',
    needsKey: true,
  },
  gemini: {
    label:   'Gemini via OpenRouter (gemini-2.0-flash)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model:   'google/gemini-2.0-flash-001',
    needsKey: true,
  },
  groq: {
    label:   'Groq (llama-3.1-8b-instant, free tier available)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model:   'llama-3.1-8b-instant',
    needsKey: true,
  },
  kimi: {
    label:   'Kimi/Moonshot (moonshot-v1-8k)',
    baseUrl: 'https://api.moonshot.cn/v1',
    model:   'moonshot-v1-8k',
    needsKey: true,
  },
  glm: {
    label:   'GLM/Zhipu (glm-4-flash, free)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model:   'glm-4-flash',
    needsKey: true,
  },
  ollama: {
    label:   'Ollama (local, fully free — runs on your machine)',
    baseUrl: 'http://localhost:11434/v1',
    model:   'llama3',
    needsKey: false,
  },
};

// ── Path constants ────────────────────────────────────────────────────────────
const CONFIG_DIR  = path.join(os.homedir(), '.mission-control');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const LOGS_DIR    = path.join(CONFIG_DIR, 'logs');
const PLIST_DIR   = path.join(os.homedir(), 'Library', 'LaunchAgents');
const PLIST_FILE  = path.join(PLIST_DIR, 'com.mission-control.plist');
const PLIST_LABEL = 'com.mission-control';

// Chrome history file location on macOS
// This is where Chrome stores your browsing history as a SQLite database.
const CHROME_HISTORY = path.join(
  os.homedir(),
  'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'History'
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[setup] Created: ${dirPath}`);
  }
}

// Parse command-line arguments in the format --key=value or --key
// Returns an object like { provider: 'deepseek', 'api-key': 'sk-xxx' }
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const withoutDashes = arg.slice(2);
      const eqIndex = withoutDashes.indexOf('=');
      if (eqIndex === -1) {
        // Flag without a value, e.g. --help
        args[withoutDashes] = true;
      } else {
        const key = withoutDashes.slice(0, eqIndex);
        // Remove surrounding quotes if present (shell sometimes keeps them)
        const val = withoutDashes.slice(eqIndex + 1).replace(/^["']|["']$/g, '');
        args[key] = val;
      }
    }
  }
  return args;
}

// Build the macOS Launch Agent plist XML string.
// A Launch Agent is macOS's built-in way to run background services —
// think of it like a startup item with better crash recovery.
function buildPlistContent() {
  let nodeBin;
  try {
    nodeBin = execSync('which node', { encoding: 'utf8' }).trim();
  } catch (_) {
    nodeBin = process.execPath;
  }

  // Absolute path to the server entry point, relative to this script's location
  const serverPath = path.resolve(path.join(__dirname, '..', 'server', 'index.js'));

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
      <string>${nodeBin}</string>
      <string>${serverPath}</string>
    </array>

    <!-- Restart the server if it crashes -->
    <key>KeepAlive</key>
    <true/>

    <!-- Start immediately when the agent is loaded -->
    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>${path.join(LOGS_DIR, 'mission-control.log')}</string>

    <key>StandardErrorPath</key>
    <string>${path.join(LOGS_DIR, 'mission-control.error.log')}</string>

    <key>WorkingDirectory</key>
    <string>${path.resolve(__dirname, '..')}</string>
  </dict>
</plist>
`;
}

// ── Check prerequisites ────────────────────────────────────────────────────────

function checkPrerequisites() {
  let ok = true;

  // Node.js version check — we need 18 or higher
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split('.')[0], 10);
  if (major < 18) {
    console.error(`[setup] ERROR: Node.js 18+ required. You have v${nodeVersion}.`);
    console.error('[setup] Download the latest Node.js at https://nodejs.org');
    ok = false;
  } else {
    console.log(`[setup] Node.js v${nodeVersion} — OK`);
  }

  // Chrome history file check — Tab Out reads from here
  if (fs.existsSync(CHROME_HISTORY)) {
    console.log(`[setup] Chrome history found — OK`);
  } else {
    console.warn(`[setup] WARNING: Chrome history not found at expected path:`);
    console.warn(`[setup]   ${CHROME_HISTORY}`);
    console.warn('[setup] Tab Out will still install, but it needs Chrome to be installed and used first.');
  }

  return ok;
}

// ── Print usage when no arguments are provided ─────────────────────────────────

function printUsageAndExit() {
  console.log('\nTab Out — Setup Script\n');
  console.log('Usage (for agents and advanced users):');
  console.log('  node scripts/setup-interactive.js --provider=<name> --api-key=<key>');
  console.log('  node scripts/setup-interactive.js --provider=ollama   (no key needed)\n');
  console.log('Available providers:\n');

  for (const [key, info] of Object.entries(PROVIDERS)) {
    const keyNote = info.needsKey ? '(API key required)' : '(no API key needed)';
    console.log(`  --provider=${key.padEnd(10)} ${info.label} ${keyNote}`);
  }

  console.log('\nOptional:');
  console.log('  --custom-rules="your rules"   Appended to the AI clustering prompt.');
  console.log('                                Example: "Group GitHub tabs by repo name."\n');
  console.log('Example:');
  console.log('  node scripts/setup-interactive.js --provider=deepseek --api-key=sk-xxx');
  console.log('  node scripts/setup-interactive.js --provider=openai --api-key=sk-xxx --custom-rules="Treat Reddit as Doom Scrolling"\n');
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();

  // If no arguments, print help and exit
  if (!args.provider) {
    printUsageAndExit();
  }

  console.log('\n=== Tab Out — Setup ===\n');

  // Validate provider
  const providerKey = args.provider.toLowerCase();
  const provider = PROVIDERS[providerKey];
  if (!provider) {
    console.error(`[setup] Unknown provider: "${args.provider}"`);
    console.error(`[setup] Valid options: ${Object.keys(PROVIDERS).join(', ')}`);
    process.exit(1);
  }

  // Check that an API key was given for providers that need one
  const apiKey = args['api-key'] || '';
  if (provider.needsKey && !apiKey) {
    console.error(`[setup] ERROR: --api-key is required for provider "${providerKey}".`);
    console.error('[setup] Run without arguments to see usage instructions.');
    process.exit(1);
  }

  // Custom prompt rules (optional)
  const customRules = args['custom-rules'] || '';

  // Step 1: Check prerequisites
  console.log('Step 1: Checking prerequisites...');
  checkPrerequisites();
  // We continue even if Chrome history is missing — it's just a warning

  // Step 2: Create directories
  console.log('\nStep 2: Creating data directories...');
  ensureDir(CONFIG_DIR);
  ensureDir(LOGS_DIR);

  // Step 3: Write config.json
  // If a config already exists, we overwrite the LLM-related fields only,
  // preserving any other settings (port, historyDays, etc.) the user may have set.
  console.log('\nStep 3: Writing config file...');
  let existingConfig = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      console.log('[setup] Found existing config — merging LLM settings into it.');
    } catch (_) {
      console.warn('[setup] Existing config was unreadable — writing a fresh one.');
    }
  }

  // Build the new config: start from existing, layer in the new LLM settings.
  // This way we don't accidentally wipe port/refreshIntervalMinutes/etc.
  const newConfig = Object.assign({}, existingConfig, {
    apiKey:             apiKey,
    baseUrl:            provider.baseUrl,
    model:              provider.model,
    // Keep these defaults if not already set
    port:               existingConfig.port               || 3456,
    refreshIntervalMinutes: existingConfig.refreshIntervalMinutes || 30,
    batchSize:          existingConfig.batchSize          || 200,
    historyDays:        existingConfig.historyDays        || 7,
    customPromptRules:  customRules || existingConfig.customPromptRules || '',
  });

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
  console.log(`[setup] Config written to: ${CONFIG_FILE}`);
  console.log(`[setup] Provider: ${provider.label}`);
  console.log(`[setup] Model:    ${provider.model}`);
  console.log(`[setup] baseUrl:  ${provider.baseUrl}`);
  if (apiKey) {
    // Only log the first 8 chars of the key so we don't expose it in logs
    console.log(`[setup] apiKey:   ${apiKey.slice(0, 8)}...`);
  } else {
    console.log('[setup] apiKey:   (none — Ollama runs locally)');
  }
  if (customRules) {
    console.log(`[setup] customPromptRules: "${customRules}"`);
  }

  // Step 4: Install macOS Launch Agent
  console.log('\nStep 4: Installing macOS Launch Agent...');
  ensureDir(PLIST_DIR);

  const plistContent = buildPlistContent();
  fs.writeFileSync(PLIST_FILE, plistContent, 'utf8');
  console.log(`[setup] Plist written to: ${PLIST_FILE}`);

  // Step 5: Load the Launch Agent with launchctl
  // launchctl is macOS's service manager. "load -w" means: register this service
  // and start it now (without requiring a logout/login).
  console.log('\nStep 5: Loading Launch Agent...');
  try {
    // Unload any existing instance first (harmless if not running)
    try {
      execSync(`launchctl unload "${PLIST_FILE}" 2>/dev/null`, { stdio: 'pipe' });
    } catch (_) { /* not loaded yet — that's fine */ }

    execSync(`launchctl load -w "${PLIST_FILE}"`, { stdio: 'inherit' });
    console.log('[setup] Launch Agent loaded — server will auto-start on login.');
  } catch (err) {
    console.warn(`[setup] Warning: launchctl load failed: ${err.message}`);
    console.warn('[setup] You can load it manually later with:');
    console.warn(`[setup]   launchctl load -w "${PLIST_FILE}"`);
  }

  // Done — print next steps
  console.log('\n=== Setup complete! ===\n');
  console.log('Next steps:');
  console.log('  1. Start the server:  npm start');
  console.log('  2. Open the dashboard to verify: http://localhost:3456');
  console.log('  3. Load the Chrome extension:');
  console.log('       a. Open chrome://extensions');
  console.log('       b. Enable Developer mode (top-right toggle)');
  console.log('       c. Click "Load unpacked"');
  console.log(`       d. Select the extension/ folder: ${path.resolve(__dirname, '..', 'extension')}`);
  console.log('  4. Open a new tab in Chrome — you should see Tab Out.\n');
  console.log(`Config file: ${CONFIG_FILE}`);
  console.log(`Logs:        ${LOGS_DIR}\n`);
}

main();
