# PrivateDocSend

Language / 语言:
- [中文](#中文)
- [English](#english)

---

## 中文

PrivateDocSend 是一个 Windows 优先的桌面小工具。  
它不会读取你的文档内容，只在你当前编辑器中自动执行“查找替换/恢复”。

### 核心能力

- 在当前编辑器执行批量脱敏：原文 -> 占位符
- 在当前编辑器执行恢复：占位符 -> 原文
- 导出/导入 `mapping.json`
- 占位符确定性生成（同一原文 + 同一类别 = 同一标记）

### 技术栈

- Tauri 2
- React + TypeScript + Zustand
- Rust（窗口焦点、键盘自动化、剪贴板桥接）

### 支持编辑器（Windows）

- Microsoft Word
- VSCode
- Typora
- WPS
- Notepad++

### 运行开发版

```bash
npm install
npm run tauri dev
```

### 打包 EXE

```bash
npm run tauri build
```

常见产物路径：

- `src-tauri/target/release/bundle/nsis/*.exe`
- `src-tauri/target/release/bundle/msi/*.msi`

### 发布到 GitHub Release（建议流程）

1. 推送代码和 tag：`git push origin main --tags`
2. 打开 GitHub 仓库 -> `Releases` -> `Draft a new release`
3. 选择 tag（例如 `v0.x.y`）
4. 上传 `.exe`（可选同时上传 `.msi`）
5. 发布

### 已知限制与冲突

本工具通过系统级快捷键自动化（如 `Ctrl+H`、粘贴、替换全部）。  
其他全局热键可能抢占输入事件，导致替换异常。

常见冲突源：

- 微信截图热键
- 第三方截图工具（Snipaste、QQ 等）
- 输入法热键
- 全局键盘/剪贴板管理工具

建议：

1. 执行前先把目标编辑器切到前台
2. 执行期间不要按键盘鼠标
3. 遇到冲突时先关闭冲突软件再重试

---

## English

PrivateDocSend is a Windows-first desktop companion for reversible editor-side replace/restore.  
It does not read your document model. It automates replace/restore directly in your active editor.

### Core Features

- Anonymize in active editor: original text -> placeholder
- Restore in active editor: placeholder -> original text
- Export / import `mapping.json`
- Deterministic placeholder generation

### Stack

- Tauri 2
- React + TypeScript + Zustand
- Rust (active window + keyboard automation + clipboard bridge)

### Supported Editors (Windows)

- Microsoft Word
- VSCode
- Typora
- WPS
- Notepad++

### Run (Dev)

```bash
npm install
npm run tauri dev
```

### Build EXE

```bash
npm run tauri build
```

Typical output paths:

- `src-tauri/target/release/bundle/nsis/*.exe`
- `src-tauri/target/release/bundle/msi/*.msi`

### GitHub Release Flow

1. Push code and tags: `git push origin main --tags`
2. Go to `Releases` -> `Draft a new release`
3. Pick tag (for example `v0.x.y`)
4. Upload `.exe` (optional `.msi`)
5. Publish release

### Known Conflicts

PrivateDocSend relies on OS-level keyboard automation (`Ctrl+H`, paste, replace-all shortcuts).  
Global shortcuts from other apps may interfere.

Common conflict sources:

- WeChat screenshot shortcut
- Third-party screenshot tools (Snipaste, QQ, etc.)
- Input method hotkeys
- Global keyboard/clipboard utilities

Recommended usage:

1. Keep target editor in foreground before running
2. Do not touch keyboard/mouse during automation
3. If conflict happens, close conflicting apps and retry
