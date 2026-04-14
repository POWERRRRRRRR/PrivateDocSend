"""PrivateDocSend — FastAPI backend service."""

import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from backend.detector.presidio_detector import detect_entities, preload
from backend.planner.replacement_planner import build_replacement_plan
from backend.restore.restore_engine import restore_text
from backend.services.anonymize_document import anonymize_document as svc_anonymize
from backend.services.restore_document import restore_document as svc_restore
from backend.models.mapping import (
    DetectRequest,
    DetectResponse,
    AnonymizeRequest,
    AnonymizeResponse,
    RestoreRequest,
    RestoreResponse,
    MappingEntry,
    FileAnonymizeRequest,
    FileAnonymizeResponse,
    FileRestoreRequest,
    FileRestoreResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pre-load spaCy models
    preload()
    yield


app = FastAPI(title="PrivateDocSend API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://localhost:5173",
        "http://127.0.0.1:1420",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/detect", response_model=DetectResponse)
async def api_detect(request: DetectRequest):
    try:
        entities = detect_entities(request.text)
        return DetectResponse(entities=entities)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/anonymize", response_model=AnonymizeResponse)
async def api_anonymize(request: AnonymizeRequest):
    try:
        # Merge confirmed auto-detected entities with user-added custom entities
        all_entities = list(request.confirmed_entities) + list(request.custom_entities)
        anonymized_text, mapping = build_replacement_plan(request.text, all_entities)
        return AnonymizeResponse(anonymized_text=anonymized_text, mapping=mapping)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/restore", response_model=RestoreResponse)
async def api_restore(request: RestoreRequest):
    try:
        restored, unreplaced = restore_text(request.text, request.mapping)
        return RestoreResponse(
            restored_text=restored,
            unreplaced_placeholders=unreplaced,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export-mapping")
async def api_export_mapping(mapping: list[MappingEntry]):
    """Return mapping as a downloadable JSON file."""
    data = [entry.model_dump() for entry in mapping]
    content = json.dumps(data, ensure_ascii=False, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=mapping.json"},
    )


@app.post("/api/file/anonymize", response_model=FileAnonymizeResponse)
async def api_file_anonymize(request: FileAnonymizeRequest):
    """File-level anonymize: takes file content + reviewed entity list,
    returns anonymized content + mapping ready for browser download."""
    try:
        return svc_anonymize(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/file/restore", response_model=FileRestoreResponse)
async def api_file_restore(request: FileRestoreRequest):
    """File-level restore: takes anonymized content + mapping JSON string,
    returns restored content ready for browser download."""
    try:
        return svc_restore(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
