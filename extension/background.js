/**
 * background.js — Service Worker for Badge Updates + Toolbar Actions
 *
 * Chrome's "always-on" background script for Tab Out.
 * It keeps the toolbar badge showing the current open tab count and lets
 * the toolbar icon save the current page to Favorites.
 *
 * Since we no longer have a server, we query chrome.tabs directly.
 * The badge counts real web tabs (skipping chrome:// and extension pages).
 *
 * Color coding gives a quick at-a-glance health signal:
 *   Green  (#3d7a4a) → 1–10 tabs  (focused, manageable)
 *   Amber  (#b8892e) → 11–20 tabs (getting busy)
 *   Red    (#b35a5a) → 21+ tabs   (time to cull!)
 */

// ─── Shared helpers ───────────────────────────────────────────────────────────

function isFavoriteCandidateUrl(url) {
  return Boolean(url) &&
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://') &&
    !url.startsWith('brave://');
}

function getFallbackFavoriteTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url;
  } catch {
    return url;
  }
}

async function flashActionBadge(text, color) {
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
    setTimeout(() => updateBadge(), 1200);
  } catch {
    updateBadge();
  }
}

async function flashSavedBadge() {
  await flashActionBadge('ADD', '#5a7a62');
}

async function flashSkippedBadge() {
  await flashActionBadge('NO', '#b35a5a');
}


// ─── Favorites ────────────────────────────────────────────────────────────────

async function saveCurrentTabAsFavorite(tab) {
  if (!tab || !isFavoriteCandidateUrl(tab.url)) return false;

  const url = tab.url;
  const title = (tab.title || '').trim() || getFallbackFavoriteTitle(url);
  const { favorites = [] } = await chrome.storage.local.get('favorites');
  const existingIndex = favorites.findIndex(site => site.url === url);

  if (existingIndex !== -1) {
    const [existing] = favorites.splice(existingIndex, 1);
    existing.title = title;
    existing.updatedAt = new Date().toISOString();
    favorites.unshift(existing);
  } else {
    favorites.unshift({
      id: Date.now().toString(),
      title,
      url,
      createdAt: new Date().toISOString(),
    });
  }

  await chrome.storage.local.set({ favorites });
  return true;
}


// ─── Badge updater ────────────────────────────────────────────────────────────

/**
 * updateBadge()
 *
 * Counts open real-web tabs and updates the extension's toolbar badge.
 * "Real" tabs = not chrome://, not extension pages, not about:blank.
 */
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});

    // Only count actual web pages — skip browser internals and extension pages
    const count = tabs.filter(t => isFavoriteCandidateUrl(t.url || '')).length;

    // Don't show "0" — an empty badge is cleaner
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    if (count === 0) return;

    // Pick badge color based on workload level
    let color;
    if (count <= 10) {
      color = '#3d7a4a'; // Green — you're in control
    } else if (count <= 20) {
      color = '#b8892e'; // Amber — things are piling up
    } else {
      color = '#b35a5a'; // Red — time to focus and close some tabs
    }

    await chrome.action.setBadgeBackgroundColor({ color });

  } catch {
    // If something goes wrong, clear the badge rather than show stale data
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

// Update badge when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

// Update badge when Chrome starts up
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Update badge whenever a tab is opened
chrome.tabs.onCreated.addListener(() => {
  updateBadge();
});

// Update badge whenever a tab is closed
chrome.tabs.onRemoved.addListener(() => {
  updateBadge();
});

// Update badge when a tab's URL changes (e.g. navigating to/from chrome://)
chrome.tabs.onUpdated.addListener(() => {
  updateBadge();
});

// Save the active page to Favorites when the toolbar icon is clicked.
chrome.action.onClicked.addListener(async (tab) => {
  const saved = await saveCurrentTabAsFavorite(tab);
  if (saved) {
    await flashSavedBadge();
  } else {
    await flashSkippedBadge();
  }
});

// ─── Initial run ─────────────────────────────────────────────────────────────

// Run once immediately when the service worker first loads
updateBadge();
