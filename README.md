# Tab Out

**Keep tabs on your tabs.**

Tab Out is a Chrome extension that replaces your new tab page with a dashboard of everything you have open. Tabs are grouped by domain, with homepages (Gmail, X, LinkedIn, etc.) pulled into their own group. Close tabs with a satisfying swoosh + confetti.

No server. No account. No external API calls. Just a Chrome extension.

> This is a fork of [zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out), **optimized and extended by [BH-M87](https://github.com/BH-M87)**. See [CHANGELOG.md](./CHANGELOG.md) for what's been added in this fork.

English | [中文](./README.zh-CN.md)

---

## Install with a coding agent

Send your coding agent (Claude Code, Codex, etc.) this repo and say **"install this"**:

```
https://github.com/BH-M87/tab-out
```

The agent will walk you through it. Takes about 1 minute.

---

## Features

**Core (from upstream)**

- **See all your tabs at a glance** on a clean grid, grouped by domain
- **Homepages group** pulls Gmail inbox, X home, YouTube, LinkedIn, GitHub homepages into one card
- **Close tabs with style** with swoosh sound + confetti burst
- **Duplicate detection** flags when you have the same page open twice, with one-click cleanup
- **Click any tab to jump to it** across windows, no new tab opened
- **Save for later** bookmark tabs to a checklist before closing them
- **Localhost grouping** shows port numbers next to each tab so you can tell your vibe coding projects apart
- **Expandable groups** show the first 8 tabs with a clickable "+N more"
- **100% local** your data never leaves your machine
- **Pure Chrome extension** no server, no Node.js, no npm, no setup beyond loading the extension

**Added in this fork (update by BH-M87)**

- **Favorites** — pin sites for quick access. Sort by custom order, name, added time, or last-visited; group by domain; drag to reorder; star any open tab to favorite it instantly. Click the toolbar icon to favorite the current page in one click.
- **Undo** — closed a tab by accident? Deleted a favorite? Hit `⌘Z` / `Ctrl+Z` within 5 seconds, or tap **Revert** on the toast.
- **Live auto-refresh** — the dashboard reacts to Chrome tab events in real time (no manual refresh, no polling), with flicker suppression for local actions.
- **Sharper tab counts & dedupe** — per-domain duplicate badges, a "Close all duplicate tabs" one-click control, and a footer total that always matches reality.

Full list and commit refs in [CHANGELOG.md](./CHANGELOG.md).

---

## Manual Setup

**1. Clone the repo**

```bash
git clone https://github.com/BH-M87/tab-out.git
```

**2. Load the Chrome extension**

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Navigate to the `extension/` folder inside the cloned repo and select it

**3. Open a new tab**

You'll see Tab Out.

---

## How it works

```
You open a new tab
  -> Tab Out shows your open tabs grouped by domain
  -> Homepages (Gmail, X, etc.) get their own group at the top
  -> Click any tab title to jump to it
  -> Close groups you're done with (swoosh + confetti)
  -> Save tabs for later before closing them
  -> Pin frequent sites to Favorites for one-click access
```

Everything runs inside the Chrome extension. No external server, no API calls, no data sent anywhere. Saved tabs and favorites are stored in `chrome.storage.local`.

---

## Tech stack

| What | How |
|------|-----|
| Extension | Chrome Manifest V3 |
| Storage | chrome.storage.local |
| Sound | Web Audio API (synthesized, no files) |
| Animations | CSS transitions + JS confetti particles |

---

## License

MIT

---

Originally built by [Zara](https://x.com/zarazhangrui). **Optimized and extended by [BH-M87](https://github.com/BH-M87)** — see [CHANGELOG.md](./CHANGELOG.md).
