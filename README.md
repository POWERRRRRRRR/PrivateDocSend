# PrivateDocSend

一个 Windows 优先的桌面小工具，用于在编辑器里做“可逆替换”：
- 脱敏时：原文 -> 占位符
- 恢复时：占位符 -> 原文

支持场景：Word / VSCode / Typora / WPS / Notepad++

## 技术栈

- Tauri 2
- React + TypeScript + Zustand
- Rust（编辑器自动化）

## 快速启动

### 1) 桌面模式（推荐，完整功能）

```bash
conda activate presidio
npm install
npm run tauri dev
```

说明：
- 这是日常使用方式。
- 自动替换/恢复、导出/导入 mapping 都在此模式。

### 2) 前端调试模式（仅 UI）

```bash
npm run dev
```

说明：
- 只看界面，不会执行桌面自动化。

### 3) Python 后端（可选）

只有你要单独调试旧 FastAPI 接口时才需要：

```bash
conda activate presidio
python -m uvicorn backend.main:app --reload --port 8000
```

## 发布前检查

```bash
npm run build
```

## 环境规范

- Python 统一使用已有 conda 环境：`presidio`
- 不使用 `.venv` / pipenv / poetry / uv

详细环境说明见 [ENV_SETUP.md](./ENV_SETUP.md)。
