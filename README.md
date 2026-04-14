# PrivateDocSend

Language / 语言：
- [中文](#中文)
- [English](#english)

---

## 中文

PrivateDocSend 是一个 Windows 优先的 Tauri 桌面小工具，用于在编辑器侧执行可逆替换/恢复。

### 项目范围

- 仅保留一种运行方式：**Tauri 桌面应用**
- 不需要 Python 后端
- 不需要 FastAPI 服务

### 技术栈

- Tauri 2
- React + TypeScript + Zustand
- Rust（编辑器自动化）

### 支持编辑器（Windows）

- Microsoft Word
- VSCode
- Typora
- WPS
- Notepad++

### 运行

```bash
npm install
npm run tauri dev
```

### 构建

```bash
npm run build
```

### 说明

- `npm run dev` 仅用于前端界面预览。
- 自动替换/恢复仅在 Tauri 桌面运行时可用。
- 导出 mapping 使用保存对话框写入你选择的路径。

### 已知冲突（重要）

PrivateDocSend 通过键盘自动化执行替换（如 `Ctrl+H`、粘贴、替换全部快捷键）。  
因此，其他应用的全局快捷键仍可能产生冲突。

常见冲突来源：

- 微信全局截图快捷键
- 第三方截图工具（Snipaste、QQ 等）
- 输入法热键
- 全局键盘/剪贴板管理工具

可能现象：

- 意外弹出截图
- 替换框未完整填入
- 未触发“替换全部”
- 焦点跳到其他应用
- 在 Word/WPS/Notepad++ 中，工具可能提示你先关闭微信截图热键后再执行

推荐使用方式：

1. 执行替换/恢复前，先把目标编辑器置于前台。
2. 临时关闭全局截图热键（尤其是微信和截图工具）。
3. 自动化执行期间（约 1-2 秒）不要按键盘或鼠标。
4. 仍冲突时，先关闭冲突软件再重试。

当前限制：

- 桌面自动化依赖操作系统按键路由。
- 在所有软件组合下无法保证 100% 无冲突。

---

## English

PrivateDocSend is a Windows-first Tauri desktop companion for reversible editor-side replace/restore.

### Scope

- Single runtime path: **Tauri desktop app only**
- No Python backend runtime is required
- No FastAPI service is required

### Stack

- Tauri 2
- React + TypeScript + Zustand
- Rust (editor automation)

### Supported editors (Windows)

- Microsoft Word
- VSCode
- Typora
- WPS
- Notepad++

### Run

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run build
```

### Notes

- `npm run dev` is UI-only preview mode.
- Replace/restore automation works in Tauri desktop runtime.
- Export mapping uses file save dialog and writes to user-selected path.

### Known Conflicts (Important)

PrivateDocSend drives editor replace by keyboard automation (`Ctrl+H`, paste, replace-all shortcuts).  
Because of that, global/system shortcuts from other apps can still conflict.

Common conflict sources:

- WeChat global screenshot shortcut
- Third-party screenshot tools (Snipaste, QQ, etc.)
- Input method hotkeys
- Clipboard managers or tools that hook keyboard/clipboard globally

Possible symptoms:

- Unexpected screenshot popup
- Replace dialog not fully filled
- Replace-all not triggered in target editor
- Focus jumps to another app during automation
- In Word/WPS/Notepad++, the app may block execution and ask you to disable WeChat screenshot hotkey first

Recommended usage:

1. Before running replace/restore, switch focus to target editor and keep it in foreground.
2. Temporarily disable global screenshot hotkeys (especially WeChat/screenshot tools).
3. Avoid pressing keyboard/mouse during automation (about 1-2 seconds per cycle).
4. If conflict still happens, close conflict apps and retry once.

Current limitation:

- Desktop automation depends on OS-level key routing.
- A fully conflict-free mode is not guaranteed across all app combinations.
