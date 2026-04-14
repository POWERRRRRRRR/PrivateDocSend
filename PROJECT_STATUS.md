# PROJECT STATUS

## Current Product Positioning

PrivateDocSend is a Tauri desktop companion for reversible editor-side replace/restore.

- Replace in active editor: original text -> deterministic placeholder
- Restore in active editor: placeholder -> original text
- Mapping export/import: `mapping.json`

## Runtime Policy (Final)

- Single runtime path: **Tauri desktop app only**
- Python backend: removed
- FastAPI service: removed

## Current Tech Stack

- Tauri 2
- React + TypeScript + Zustand
- Rust automation modules:
  - `src-tauri/src/active_window.rs`
  - `src-tauri/src/clipboard_bridge.rs`
  - `src-tauri/src/editor_automation.rs`

## UI Status

- `Anonymize` tab:
  - input original text
  - choose entity type
  - preview deterministic placeholder
  - replace all in active editor
  - export mapping
- `Restore` tab:
  - import mapping
  - restore single mapping
  - restore all mappings

## Repository Cleanup Status

- Removed runtime backend folder: `backend/`
- Removed `backend:dev` script from `package.json`
- Removed `localhost:8000` dependency from Tauri CSP
- Kept only Tauri-centric docs and commands

## How to Run

```bash
npm install
npm run tauri dev
```
