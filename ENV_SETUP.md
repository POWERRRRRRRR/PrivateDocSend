# ENV_SETUP

## 1) Python Backend (Conda only)

Use your existing Conda environment:

```bash
conda activate presidio
python -m uvicorn backend.main:app --reload --port 8000
```

Rules:

- Backend must run inside `presidio`.
- Do not create or use `.venv` for this project.
- Do not switch to `pipenv`, `poetry`, or `uv` workflows.

## 2) Frontend

```bash
npm install
npm run dev
```

## 3) Tauri (later)

After installing Rust toolchain + Visual Studio Build Tools (MSVC + Windows SDK):

```bash
npm run tauri dev
```
