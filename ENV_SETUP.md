# ENV_SETUP

## Runtime Policy

PrivateDocSend uses a single runtime path: **Tauri desktop app**.

- Do not start Python backend for normal usage.
- Do not start FastAPI service for normal usage.

## Prerequisites

1. Node.js (LTS)
2. Rust toolchain (`rustup`, `cargo`, `rustc`)
3. Visual Studio Build Tools on Windows (MSVC + Windows SDK)

## Install

```bash
npm install
```

## Development

```bash
npm run tauri dev
```

## Frontend preview only (optional)

```bash
npm run dev
```
