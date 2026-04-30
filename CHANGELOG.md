# ChangeLog

记录从上游 [zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out) Fork 之后（基线 commit `2c9b9c5`）添加的改动。所有改动均针对 Chrome 扩展本身（`extension/`），无新增依赖。

## 收藏夹（Favorites）— 全新功能

上游版本没有收藏夹。这是 Fork 之后最大的功能补充。

- **基础收藏管理**（`a6387bb`）— 在 Open tabs 区域上方新增 Favorites 板块，支持手动添加、编辑、删除收藏；条目带 favicon、标题、域名。
- **拖拽排序**（`1c6d883`）— 收藏条目左侧带拖拽手柄，按住可调整顺序，顺序持久化到 `chrome.storage.local`。
- **工具栏一键收藏**（`77ae801`）— 点击浏览器工具栏的扩展图标，把当前 tab 直接存进收藏。badge 临时闪 `ADD`（绿）或 `NO`（红，URL 不可收藏时）。
- **多种排序与分组**（`64c3a9f`）
  - 排序：自定义 / 字母 / 添加时间 / 最近访问。
  - 按域名分组显示，可单独折叠/展开；分组卡片显示该域名下收藏数与预览。
  - 在 Open tabs 的 chip 上加了星标按钮，可直接把 tab 加进/移出收藏，不必先打开收藏表单。
- **总数显示与样式打磨**（`a7370b0`）— Favorites 标题旁显示总条数；卡片视觉细化。

## 撤销（Undo）

- **关闭/删除可撤销**（`c5725de`）— 关闭单个 tab、关闭整组 tab、保存 tab 到稍后再看、删除收藏、删除归档项之后，Toast 上多一个 Revert 按钮。
- **键盘快捷键**（`c5725de`）— 5 秒内按 ⌘Z / Ctrl+Z 也能撤销，不必去点 Toast。
- **还原后正确刷新**（`d47dd59`）— 修复撤销恢复 tab 后仪表盘没及时把它显示回来的问题。

## 仪表盘自动刷新（Auto-refresh）

上游版本只有手动 / 周期性刷新。Fork 之后改成事件驱动。

- **监听 Chrome tab 事件**（`199696d`）— 监听 `chrome.tabs` 的 `onCreated` / `onRemoved` / `onUpdated` / `onMoved` / `onActivated` 以及 `chrome.windows.onFocusChanged`，tab 一变化仪表盘就重绘。带 150ms debounce。
- **等加载完成再刷新**（`4de07b2`）— `onUpdated` 只在 `status === 'complete'` 时触发，避免显示空白标题或 pending URL。
- **抑制本地操作的闪烁**（`e26c400`）— Tab Out 自己关闭/打开的 tab，800ms 内忽略自动刷新事件，避免卡片重渲染抖动。
- **修复页脚 "Open tabs" 数字不刷新**（`1cbcea3`）— "Close all tabs"、"Close extras"、"Save for later" 这三类操作触发后，左下角的 tab 总数能立刻同步；同时把显示口径从所有 tab 改为真实网页数（排除 chrome:// 与扩展页）。

## Tab 计数与去重（Tab counts & duplicates）

`a7370b0` 这一笔集中改了 Open tabs 区域的可读性和操作性：

- 区域顶部显示 `N domains · M tabs`。
- 自动检测重复 URL，给出"Close all duplicate tabs (N)"一键按钮。
- 域名卡片右上角显示该域 tab 数；有重复时多一个去重按钮（保留一个）。
- 重复的 chip 视觉上做了区分。

## 其它

- **归档项删除**（`a6387bb`）— "稍后再看"归档列表中的条目可以单条删除（之前只能整体清空或恢复）。
- **测试覆盖**（贯穿所有 commit）— `tests/static-ui.test.js` 从 ~10 个断言增长到 24 个测试 / 数百个断言，覆盖收藏夹、撤销、自动刷新、计数等所有新增逻辑。

## 时间线

```
2026-04-28  a6387bb  Add favorites and archive controls
2026-04-29  1c6d883  Add favorite drag sorting
2026-04-29  77ae801  Add toolbar favorite action
2026-04-30  64c3a9f  Enhance favorites and open tab controls
2026-04-30  199696d  Auto-refresh dashboard on tab changes
2026-04-30  4de07b2  Refresh dashboard after tab loads complete
2026-04-30  e26c400  Suppress local tab action refresh flicker
2026-04-30  c5725de  Add undo for delete and close actions
2026-04-30  d47dd59  Fix undo refresh for restored tabs
2026-04-30  a7370b0  Refine tab counts and duplicate controls
2026-04-30  1cbcea3  Fix live open tab footer count
```
