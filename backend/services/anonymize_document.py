"""File-level anonymization service."""

import json
from pathlib import Path

from backend.planner.replacement_planner import build_replacement_plan
from backend.models.mapping import (
    FileAnonymizeRequest,
    FileAnonymizeResponse,
)


def anonymize_document(request: FileAnonymizeRequest) -> FileAnonymizeResponse:
    """Run detection-confirmed entities through the replacement planner and
    package the results for browser download.

    The caller is responsible for having already run detection and letting the
    user review/edit the entity list.  This function only handles:
      1. Merging confirmed + custom entities
      2. Running the one-pass replacement planner
      3. Deriving output filenames (xxx.anonymized.md, xxx.mapping.json)
      4. Serialising the mapping to JSON
    """
    all_entities = list(request.confirmed_entities) + list(request.custom_entities)
    anonymized_content, mapping = build_replacement_plan(request.content, all_entities)

    # Derive output filenames — strip any existing .anonymized suffix so
    # re-processing a previously anonymized file doesn't double-suffix it.
    p = Path(request.filename)
    stem = p.stem.removesuffix(".anonymized")
    ext = p.suffix or ".md"
    anonymized_filename = f"{stem}.anonymized{ext}"
    mapping_filename = f"{stem}.mapping.json"

    mapping_json = json.dumps(
        [m.model_dump() for m in mapping],
        ensure_ascii=False,
        indent=2,
    )

    return FileAnonymizeResponse(
        anonymized_content=anonymized_content,
        anonymized_filename=anonymized_filename,
        mapping_json=mapping_json,
        mapping_filename=mapping_filename,
        mapping=mapping,
    )
