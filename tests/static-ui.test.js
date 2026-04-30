const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'extension/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'extension/app.js'), 'utf8');
const backgroundJs = fs.readFileSync(path.join(root, 'extension/background.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'extension/style.css'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8'));

test('renders a top favorites section before the dashboard columns', () => {
  assert.match(indexHtml, /id="favoritesSection"/);
  assert.match(indexHtml, /data-action="toggle-favorite-form"/);
  assert.match(indexHtml, /data-action="sort-favorites"/);
  assert.match(indexHtml, /data-action="toggle-favorite-grouping"/);
  assert.match(indexHtml, /data-sort-mode="alphabet"/);
  assert.match(indexHtml, /data-sort-mode="created"/);
  assert.match(indexHtml, /data-sort-mode="visited"/);
  assert.match(indexHtml, /data-sort-mode="custom"/);
  assert.match(indexHtml, /id="favoriteForm"[^>]*style="display:none"/);
  assert.match(indexHtml, /id="favoriteName"/);
  assert.match(indexHtml, /id="favoriteUrl"/);
  assert.ok(indexHtml.indexOf('id="favoritesSection"') < indexHtml.indexOf('id="dashboardColumns"'));
});

test('favorites are persisted, rendered, opened, and removed from chrome.storage.local', () => {
  assert.match(appJs, /async function getFavoriteSites\(\)/);
  assert.match(appJs, /async function saveFavoriteSite\(/);
  assert.match(appJs, /async function updateFavoriteSite\(/);
  assert.match(appJs, /async function deleteFavoriteSite\(/);
  assert.match(appJs, /async function renderFavoritesSection\(\)/);
  assert.match(appJs, /function deriveFavoriteTitleFromUrl\(/);
  assert.match(appJs, /function autofillFavoriteNameFromUrl\(/);
  assert.match(appJs, /favoriteNameWasEdited/);
  assert.match(appJs, /action === 'toggle-favorite-form'/);
  assert.match(appJs, /data-action="open-favorite"/);
  assert.match(appJs, /data-action="edit-favorite"/);
  assert.match(appJs, /data-action="delete-favorite"/);
  assert.match(appJs, /chrome\.tabs\.create/);
});

test('favorites support drag-and-drop reordering with persisted order', () => {
  assert.match(appJs, /async function reorderFavoriteSites\(/);
  assert.match(appJs, /draggable="true"/);
  assert.match(appJs, /data-action="drag-favorite"/);
  assert.match(appJs, /favoriteDragState/);
  assert.match(appJs, /addEventListener\('dragstart'/);
  assert.match(appJs, /addEventListener\('dragover'/);
  assert.match(appJs, /addEventListener\('drop'/);
  assert.match(appJs, /await reorderFavoriteSites\(/);
  assert.match(css, /\.favorite-item\.dragging/);
  assert.match(css, /\.favorite-item\.drag-over/);
  assert.match(css, /\.favorite-drag-handle/);
});

test('favorites support restoring custom manual order after temporary sorts', () => {
  assert.match(appJs, /const favoriteSortModes = \['custom', 'alphabet', 'created', 'visited'\];/);
  assert.match(appJs, /favoriteSortMode = 'custom'/);
  assert.match(appJs, /if \(mode === 'custom'\) return sorted;/);
  assert.match(appJs, /await setFavoriteSortMode\('custom'\);/);
  assert.match(indexHtml, /data-sort-mode="custom"[^>]*>Custom/);
});

test('favorites are grouped by domain and sorted by selected mode', () => {
  assert.match(appJs, /async function getFavoriteSortMode\(\)/);
  assert.match(appJs, /async function setFavoriteSortMode\(/);
  assert.match(appJs, /async function getFavoriteGroupingEnabled\(\)/);
  assert.match(appJs, /function getFavoriteDomain\(/);
  assert.match(appJs, /function groupFavoriteSitesByDomain\(/);
  assert.match(appJs, /function sortFavoriteSites\(/);
  assert.match(appJs, /function renderFavoriteGroup\(/);
  assert.match(appJs, /data-favorite-domain=/);
  assert.match(appJs, /action === 'sort-favorites'/);
  assert.match(css, /\.favorite-sort/);
  assert.match(css, /\.favorite-group/);
  assert.match(css, /\.favorite-group-header/);
});

test('favorite domain groups are compact, expandable, and optional', () => {
  assert.match(appJs, /async function getFavoriteExpandedDomains\(\)/);
  assert.match(appJs, /async function toggleFavoriteGroupExpanded\(/);
  assert.match(appJs, /data-action="toggle-favorite-group"/);
  assert.match(appJs, /favoriteExpandedDomains/);
  assert.match(appJs, /favoriteGroupPreviewLimit/);
  assert.match(appJs, /favorite-group-preview/);
  assert.match(appJs, /favorite-group-state/);
  assert.match(appJs, /overflowCount/);
  assert.match(appJs, /renderFavoriteFlatList/);
  assert.match(appJs, /action === 'toggle-favorite-grouping'/);
  assert.match(css, /\.favorite-group-grid/);
  assert.match(css, /\.favorite-group-card/);
  assert.match(css, /\.favorite-group-preview/);
  assert.match(css, /\.favorite-group-expanded/);
  assert.match(css, /\.favorite-group-state/);
  assert.doesNotMatch(appJs, /favorite-group-chevron/);
  assert.doesNotMatch(css, /\.favorite-group-chevron/);
});

test('favorite groups use dense aligned grid spans to reduce empty gaps', () => {
  assert.match(appJs, /favorite-group-span-\$\{spanSize\}/);
  assert.match(appJs, /favorite-sort-\$\{sortMode\}/);
  assert.match(css, /\.favorite-group-grid\s*\{[\s\S]*display:\s*grid;/);
  assert.match(css, /\.favorite-group-grid\s*\{[^}]*grid-auto-flow:\s*dense;/);
  assert.doesNotMatch(css, /\.favorite-group-grid\.favorite-sort-custom/);
  assert.match(css, /\.favorite-group-span-2\s*\{[\s\S]*grid-column:\s*span 2;/);
  assert.match(css, /\.favorite-group-span-3\s*\{[\s\S]*grid-column:\s*span 3;/);
  assert.match(css, /\.favorite-group-span-2\s+\.favorite-group-preview\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(css, /\.favorite-group-span-3\s+\.favorite-group-preview\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
});

test('open tab group close control lives in the card header', () => {
  assert.match(appJs, /const closeGroupButton = `<button class="open-tabs-badge open-tabs-close"/);
  assert.match(appJs, /const closeDupesButton = hasDupes/);
  assert.match(appJs, /class="open-tabs-badge open-tabs-close open-tabs-dedupe"/);
  assert.match(appJs, /Close duplicate\$\{totalExtras !== 1 \? 's' : ''\}/);
  assert.match(appJs, /\$\{tabBadge\}\s*\$\{closeGroupButton\}/);
  assert.match(appJs, /\$\{dupeBadge\}\s*\$\{closeDupesButton\}/);
  assert.doesNotMatch(appJs, /let actionsHtml = `\s*<button class="action-btn close-tabs"/);
  assert.doesNotMatch(appJs, /<div class="actions">/);
  assert.match(css, /\.open-tabs-close/);
});

test('favorite items can be edited in place through the favorite form', () => {
  assert.match(appJs, /let favoriteEditingId = null;/);
  assert.match(appJs, /function setFavoriteFormOpen\(open, site = null\)/);
  assert.match(appJs, /favoriteEditingId = site \? site\.id : null;/);
  assert.match(appJs, /data-action="edit-favorite"/);
  assert.match(appJs, /await updateFavoriteSite\(favoriteEditingId, \{ title, url \}\);/);
  assert.match(appJs, /favoriteEditingId = null;/);
  assert.match(css, /\.favorite-edit/);
});

test('favorite items include added and last visited timestamps', () => {
  assert.match(appJs, /function ensureFavoriteMetadata\(/);
  assert.match(appJs, /async function markFavoriteVisited\(/);
  assert.match(appJs, /createdAt/);
  assert.match(appJs, /lastVisitedAt/);
  assert.match(appJs, /favorite-meta/);
  assert.match(appJs, /Added/);
  assert.match(appJs, /Visited/);
  assert.match(appJs, /await markFavoriteVisited\(id\)/);
  assert.match(backgroundJs, /domain/);
  assert.match(backgroundJs, /createdAt/);
  assert.match(backgroundJs, /lastVisitedAt/);
});

test('opening a favorite focuses an existing tab before creating a new one', () => {
  assert.match(appJs, /async function focusTab\(url\)/);
  assert.match(appJs, /return true;/);
  assert.match(appJs, /return false;/);
  assert.match(appJs, /const didFocus = await focusTab\(url\);/);
  assert.match(appJs, /if \(!didFocus\) \{[\s\S]*await chrome\.tabs\.create\(\{ url \}\);[\s\S]*\}/);
});

test('open tab rows can be added directly to favorites', () => {
  assert.match(appJs, /data-action="favorite-open-tab"/);
  assert.match(appJs, /chip-action chip-favorite/);
  assert.match(appJs, /action === 'favorite-open-tab'/);
  assert.match(appJs, /await saveFavoriteSite\(\{ title: tabTitle, url: tabUrl \}\);/);
  assert.match(appJs, /renderFavoritesSection\(\)/);
  assert.match(css, /\.chip-favorite/);
});

test('open tab favorite buttons show and toggle favorite state', () => {
  assert.match(appJs, /function getFavoriteByUrl\(/);
  assert.match(appJs, /function isFavoriteUrl\(/);
  assert.match(appJs, /favoriteUrls/);
  assert.match(appJs, /chip-favorite active/);
  assert.match(appJs, /title="\$\{favoriteActive \? 'Remove from favorites' : 'Add to favorites'\}"/);
  assert.match(appJs, /const existingFavorite = await getFavoriteByUrl\(tabUrl\);/);
  assert.match(appJs, /await deleteFavoriteSite\(existingFavorite\.id\);/);
  assert.match(appJs, /setOpenTabFavoriteButtons\(tabUrl, false\);/);
  assert.match(appJs, /setOpenTabFavoriteButtons\(tabUrl, true\);/);
  assert.match(css, /\.chip-favorite\.active/);
});

test('toolbar icon click saves the current page to favorites', () => {
  assert.ok(manifest.action);
  assert.match(backgroundJs, /chrome\.action\.onClicked\.addListener/);
  assert.match(backgroundJs, /async function saveCurrentTabAsFavorite\(/);
  assert.match(backgroundJs, /function isFavoriteCandidateUrl\(/);
  assert.match(backgroundJs, /chrome\.storage\.local\.get\('favorites'\)/);
  assert.match(backgroundJs, /chrome\.storage\.local\.set\(\{ favorites/);
  assert.match(backgroundJs, /existing\.title = title/);
  assert.match(backgroundJs, /normalizedFavorites\.unshift/);
});

test('dashboard refreshes favorites when toolbar click updates storage', () => {
  assert.match(appJs, /chrome\.storage\.onChanged\.addListener/);
  assert.match(appJs, /changes\.favorites/);
  assert.match(appJs, /areaName === 'local'/);
  assert.match(appJs, /renderFavoritesSection\(\)/);
  assert.match(appJs, /syncOpenTabFavoriteButtons\(/);
});

test('dashboard auto-refreshes open tabs from Chrome tab events', () => {
  assert.match(appJs, /const dashboardRefreshDelayMs = 150;/);
  assert.match(appJs, /const localTabActionRefreshIgnoreMs = 800;/);
  assert.match(appJs, /function scheduleDashboardRefresh\(\)/);
  assert.match(appJs, /function ignoreDashboardRefreshForLocalTabAction\(\)/);
  assert.match(appJs, /function shouldIgnoreDashboardRefresh\(\)/);
  assert.match(appJs, /async function refreshDashboardFromTabEvents\(\)/);
  assert.match(appJs, /function registerDashboardTabListeners\(\)/);
  assert.match(appJs, /if \(shouldIgnoreDashboardRefresh\(\)\) return;/);
  assert.match(appJs, /chrome\.tabs\.onCreated\.addListener\(scheduleDashboardRefresh\)/);
  assert.match(appJs, /chrome\.tabs\.onRemoved\.addListener\(scheduleDashboardRefresh\)/);
  assert.match(appJs, /chrome\.tabs\.onMoved\.addListener\(scheduleDashboardRefresh\)/);
  assert.match(appJs, /chrome\.tabs\.onUpdated\.addListener\(handleTabUpdatedForRefresh\)/);
  assert.match(appJs, /chrome\.tabs\.onActivated\.addListener\(scheduleDashboardRefresh\)/);
  assert.match(appJs, /chrome\.windows\.onFocusChanged\.addListener\(scheduleDashboardRefresh\)/);
  assert.match(appJs, /changeInfo\.status === 'complete'/);
  assert.doesNotMatch(appJs, /changeInfo\.url \|\|/);
  assert.doesNotMatch(appJs, /changeInfo\.title \|\|/);
  assert.match(appJs, /clearTimeout\(dashboardRefreshTimer\)/);
  assert.match(appJs, /setTimeout\(refreshDashboardFromTabEvents, dashboardRefreshDelayMs\)/);
  assert.match(appJs, /window\.addEventListener\('beforeunload', unregisterDashboardTabListeners\)/);
});

test('local tab actions suppress automatic dashboard refresh flicker', () => {
  const ignoreCalls = appJs.match(/ignoreDashboardRefreshForLocalTabAction\(\);/g) || [];
  assert.ok(ignoreCalls.length >= 7);
  assert.match(appJs, /ignoreDashboardRefreshForLocalTabAction\(\);\s*await chrome\.tabs\.remove/);
  assert.match(appJs, /ignoreDashboardRefreshForLocalTabAction\(\);\s*await chrome\.tabs\.update/);
  assert.match(appJs, /ignoreDashboardRefreshForLocalTabAction\(\);\s*await chrome\.tabs\.create/);
});

test('archived saved tabs can be deleted from the archive list', () => {
  assert.match(appJs, /async function deleteSavedTab\(/);
  assert.match(appJs, /data-action="delete-archive-item"/);
  assert.match(appJs, /action === 'delete-archive-item'/);
});

test('new favorite and archive controls have dedicated styling', () => {
  assert.match(css, /\.favorites-section/);
  assert.match(css, /\.favorite-toggle/);
  assert.match(css, /\.favorite-toggle\s*\{[\s\S]*width:\s*28px;[\s\S]*height:\s*28px;[\s\S]*border-radius:\s*4px;[\s\S]*border:\s*none;/);
  assert.match(css, /\.favorite-form/);
  assert.match(css, /\.favorite-delete/);
  assert.match(css, /\.archive-delete/);
});
