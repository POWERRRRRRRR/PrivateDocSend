from pydantic import BaseModel


class EntitySpan(BaseModel):
    """A detected or user-defined entity in the document."""
    text: str
    entity_type: str
    start: int
    end: int
    score: float = 1.0
    source: str = "auto"  # "auto" | "custom"


class MappingEntry(BaseModel):
    """A single placeholder-to-original mapping."""
    placeholder: str
    original: str
    entity_type: str


# --- API request / response models ---

class DetectRequest(BaseModel):
    text: str


class DetectResponse(BaseModel):
    entities: list[EntitySpan]


class AnonymizeRequest(BaseModel):
    text: str
    confirmed_entities: list[EntitySpan]
    custom_entities: list[EntitySpan] = []


class AnonymizeResponse(BaseModel):
    anonymized_text: str
    mapping: list[MappingEntry]


class RestoreRequest(BaseModel):
    text: str
    mapping: list[MappingEntry]


class RestoreResponse(BaseModel):
    restored_text: str
    unreplaced_placeholders: list[str] = []


# --- File-level API models ---

class FileAnonymizeRequest(BaseModel):
    content: str
    filename: str = "document.md"
    confirmed_entities: list[EntitySpan] = []
    custom_entities: list[EntitySpan] = []


class FileAnonymizeResponse(BaseModel):
    anonymized_content: str
    anonymized_filename: str
    mapping_json: str          # JSON string for browser download as .json file
    mapping_filename: str
    mapping: list[MappingEntry]  # structured, for frontend display


class FileRestoreRequest(BaseModel):
    content: str               # anonymized file content
    filename: str = "document.anonymized.md"
    mapping_json: str          # raw JSON string of mapping array


class FileRestoreResponse(BaseModel):
    restored_content: str
    restored_filename: str
    unreplaced_placeholders: list[str] = []
