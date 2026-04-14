"""File-level restoration service."""

import json
from pathlib import Path

from backend.restore.restore_engine import restore_text
from backend.models.mapping import (
    MappingEntry,
    FileRestoreRequest,
    FileRestoreResponse,
)


def restore_document(request: FileRestoreRequest) -> FileRestoreResponse:
    """Parse the mapping JSON string and restore the anonymized content.

    Derives the output filename by stripping .anonymized from the stem so that
    report.anonymized.md → report.restored.md.
    """
    mapping_data = json.loads(request.mapping_json)
    mapping = [MappingEntry(**entry) for entry in mapping_data]

    restored_content, unreplaced = restore_text(request.content, mapping)

    p = Path(request.filename)
    stem = p.stem.removesuffix(".anonymized")
    ext = p.suffix or ".md"
    restored_filename = f"{stem}.restored{ext}"

    return FileRestoreResponse(
        restored_content=restored_content,
        restored_filename=restored_filename,
        unreplaced_placeholders=unreplaced,
    )
