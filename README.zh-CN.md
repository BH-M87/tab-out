# Tab Out

**管好你的标签页。**

Tab Out 是一个 Chrome 扩展，把新标签页换成一个仪表盘 —— 当前所有打开的标签按域名分组展示。Gmail、X、LinkedIn 这类首页会被单独归到一组。关闭标签时还有 swoosh 音效和五彩纸屑。

不需要服务器，不需要账号，不调用任何外部 API。就是个 Chrome 扩展。

> 本仓库 Fork 自 [zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out)，由 [BH-M87](https://github.com/BH-M87) 优化扩展。Fork 之后增加的内容见 [CHANGELOG.md](./CHANGELOG.md)。

[English](./README.md) | 中文

---

## 用 Coding Agent 安装

把这个仓库地址丢给 Claude Code、Codex 之类的 coding agent，说一句 **"install this"**：

```
https://github.com/BH-M87/tab-out
```

Agent 会带你走完流程，大概 1 分钟。

---

## 功能

**上游核心功能**

- **一眼看全所有标签** —— 按域名网格展示
- **首页归组** —— Gmail 收件箱、X 首页、YouTube、LinkedIn、GitHub 这些首页统一进一张卡片，方便一次清掉
- **关标签有仪式感** —— swoosh 音效 + 五彩纸屑
- **重复检测** —— 同一个页面开了两次会被标出来，一键去重
- **点标题直接跳转** —— 跨窗口也行，不会再开新标签
- **稍后再看** —— 把标签收进清单，关掉之后还能找回
- **Localhost 分组** —— 端口号会显示在标签旁边，多个本地项目不会混
- **可展开分组** —— 默认显示前 8 个标签，多的折成 "+N more"
- **完全本地** —— 数据不离开你的机器
- **纯扩展** —— 不需要 server、Node.js、npm，加载扩展就能用

**Fork 之后新增 (update by BH-M87)**

- **收藏夹** —— 把常用网站置顶。支持自定义、字母、添加时间、最近访问四种排序，可按域名分组，能拖拽调整顺序。任意 open tab 上点星标可直接收藏；点工具栏图标可一键收藏当前页。
- **撤销** —— 不小心关错标签或删错收藏？5 秒内按 `⌘Z` / `Ctrl+Z`，或者点 Toast 上的 **Revert**。
- **实时自动刷新** —— 仪表盘监听 Chrome 的标签事件，开/关/切换标签时立刻更新，不用手动刷新，本地操作不会闪烁。
- **更准的标签计数与去重** —— 每个域名旁显示重复数，提供"关闭所有重复标签"一键按钮，左下角的总数始终与实际一致。

完整列表和 commit 引用见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 手动安装

**1. 克隆仓库**

```bash
git clone https://github.com/BH-M87/tab-out.git
```

**2. 加载 Chrome 扩展**

1. 打开 Chrome，访问 `chrome://extensions`
2. 打开右上角的 **开发者模式**
3. 点 **加载已解压的扩展程序**
4. 选中仓库里的 `extension/` 文件夹

**3. 开个新标签**

就能看到 Tab Out 了。

---

## 工作原理

```
你打开新标签
  -> Tab Out 按域名分组展示当前所有标签
  -> 首页 (Gmail、X 等) 单独归一组放在最上面
  -> 点标题跳到那个标签
  -> 不用了的整组关掉 (swoosh + 纸屑)
  -> 关闭前可以存进"稍后再看"
  -> 常用站点钉到收藏夹一键打开
```

所有逻辑都在扩展内部。没有外部服务器，不发任何请求，"稍后再看"的标签和收藏夹都存在 `chrome.storage.local` 里。

---

## 技术栈

| 类别 | 实现 |
|------|------|
| 扩展 | Chrome Manifest V3 |
| 存储 | chrome.storage.local |
| 音效 | Web Audio API（合成，没有音频文件） |
| 动画 | CSS transitions + JS 粒子 |

---

## License

MIT

---

原作者 [Zara](https://x.com/zarazhangrui)。**由 [BH-M87](https://github.com/BH-M87) 完善与扩展** —— 详见 [CHANGELOG.md](./CHANGELOG.md)。
