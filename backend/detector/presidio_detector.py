"""Entity detection using Microsoft Presidio + custom recognizers."""

import re
from typing import Optional

from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider

from backend.models.mapping import EntitySpan

# Deny-list: common all-caps acronyms that are NOT project names
_ACRONYM_DENY_LIST = {
    "API", "HTML", "CSS", "JSON", "HTTP", "HTTPS", "URL", "PDF", "SQL",
    "XML", "SDK", "CLI", "GUI", "IDE", "MVP", "PRD", "TDD", "FAQ", "SaaS",
    "REST", "CRUD", "TODO", "README", "NULL", "TRUE", "FALSE", "NLP",
    "NER", "LLM", "GPT", "AI", "ML", "DL", "CPU", "GPU", "RAM", "SSD",
    "USB", "CORS", "CSRF", "JWT", "SSH", "FTP", "DNS", "TCP", "UDP",
    "SMTP", "IMAP", "POP", "YAML", "TOML", "CSV", "TSV", "PNG", "JPG",
    "JPEG", "GIF", "SVG", "MP4", "MP3", "WAV", "ZIP", "TAR", "GZ",
}

# Maximum reasonable character length for an entity span
_MAX_SPAN_LEN: dict[str, int] = {
    "PERSON": 20,
    "ORG": 25,
    "PROJECT": 20,
    "FILE": 100,
    "PHONE_NUMBER": 20,
    "EMAIL_ADDRESS": 60,
    "LOCATION": 25,
    "NRP": 20,
}
_DEFAULT_MAX_SPAN_LEN = 30

_analyzer: Optional[AnalyzerEngine] = None


def _has_cjk(text: str) -> bool:
    """Check if text contains CJK characters."""
    return bool(re.search(r"[\u4e00-\u9fff\u3400-\u4dbf]", text))


def _create_project_recognizer() -> PatternRecognizer:
    """Recognizer for all-caps project codes (e.g., PRSOV, SKYNET)."""
    return PatternRecognizer(
        supported_entity="PROJECT",
        name="project_recognizer",
        patterns=[
            Pattern(
                name="allcaps_code",
                regex=r"\b[A-Z][A-Z0-9_-]{2,9}\b",
                score=0.6,
            ),
        ],
        deny_list=list(_ACRONYM_DENY_LIST),
        supported_language="en",
    )


def _create_file_recognizer() -> PatternRecognizer:
    """Recognizer for file names and paths."""
    return PatternRecognizer(
        supported_entity="FILE",
        name="file_recognizer",
        patterns=[
            Pattern(
                name="filename_with_ext",
                regex=r"\b[\w][\w.\-]*\.(txt|md|docx|pdf|xlsx|csv|py|js|ts|java|go|rs|c|cpp|h|json|yaml|yml|toml|xml|html|css|sql|sh|bat|log|conf|cfg|ini)\b",
                score=0.75,
            ),
            Pattern(
                name="windows_path",
                regex=r"[A-Za-z]:\\(?:[^\\\/:*?\"<>|\r\n]+\\)*[^\\\/:*?\"<>|\r\n]+\.\w{1,5}",
                score=0.85,
            ),
        ],
        supported_language="en",
    )


def _get_analyzer() -> AnalyzerEngine:
    """Lazy-initialize the Presidio AnalyzerEngine (singleton)."""
    global _analyzer
    if _analyzer is not None:
        return _analyzer

    # Try to set up multilingual; fall back to English-only
    try:
        configuration = {
            "nlp_engine_name": "spacy",
            "models": [
                {"lang_code": "en", "model_name": "en_core_web_sm"},
                {"lang_code": "zh", "model_name": "zh_core_web_sm"},
            ],
        }
        provider = NlpEngineProvider(nlp_configuration=configuration)
        nlp_engine = provider.create_engine()
        _analyzer = AnalyzerEngine(
            nlp_engine=nlp_engine,
            supported_languages=["en", "zh"],
        )
    except Exception:
        # Chinese model not installed — English only
        _analyzer = AnalyzerEngine()

    # Register custom recognizers
    _analyzer.registry.add_recognizer(_create_project_recognizer())
    _analyzer.registry.add_recognizer(_create_file_recognizer())

    return _analyzer


def _deduplicate_overlaps(spans: list[EntitySpan]) -> list[EntitySpan]:
    """Remove overlapping spans, keeping the longer (or higher-scored) one."""
    if not spans:
        return []

    sorted_spans = sorted(spans, key=lambda s: (s.start, -(s.end - s.start)))
    result: list[EntitySpan] = [sorted_spans[0]]

    for span in sorted_spans[1:]:
        prev = result[-1]
        if span.start < prev.end:
            # Overlap: keep the longer span, or higher score if same length
            prev_len = prev.end - prev.start
            curr_len = span.end - span.start
            if curr_len > prev_len or (curr_len == prev_len and span.score > prev.score):
                result[-1] = span
        else:
            result.append(span)

    return result


def detect_entities(text: str) -> list[EntitySpan]:
    """Detect sensitive entities in the given text.

    Returns a deduplicated, sorted list of EntitySpan objects.
    """
    analyzer = _get_analyzer()
    all_spans: list[EntitySpan] = []

    # Always run English analysis (handles PERSON, ORG, PHONE, EMAIL, etc.)
    en_results = analyzer.analyze(
        text=text,
        language="en",
        entities=[
            "PERSON", "ORGANIZATION", "PHONE_NUMBER", "EMAIL_ADDRESS",
            "PROJECT", "FILE",
        ],
        score_threshold=0.4,
    )
    for r in en_results:
        matched = text[r.start : r.end]
        entity_type = r.entity_type
        # Normalize Presidio's ORGANIZATION to ORG
        if entity_type == "ORGANIZATION":
            entity_type = "ORG"
        all_spans.append(
            EntitySpan(
                text=matched,
                entity_type=entity_type,
                start=r.start,
                end=r.end,
                score=r.score,
                source="auto",
            )
        )

    # Run Chinese analysis if CJK characters are present
    if _has_cjk(text) and "zh" in analyzer.supported_languages:
        zh_results = analyzer.analyze(
            text=text,
            language="zh",
            score_threshold=0.4,
        )
        for r in zh_results:
            matched = text[r.start : r.end]
            entity_type = r.entity_type
            if entity_type == "ORGANIZATION":
                entity_type = "ORG"
            all_spans.append(
                EntitySpan(
                    text=matched,
                    entity_type=entity_type,
                    start=r.start,
                    end=r.end,
                    score=r.score,
                    source="auto",
                )
            )

    # Filter out unreasonably long spans (spaCy NER sometimes produces garbage spans)
    all_spans = [
        s for s in all_spans
        if (s.end - s.start) <= _MAX_SPAN_LEN.get(s.entity_type, _DEFAULT_MAX_SPAN_LEN)
    ]

    # Filter out NRP (Nationality/Religious/Political) — too many false positives
    all_spans = [s for s in all_spans if s.entity_type != "NRP"]

    # Deduplicate overlapping spans
    all_spans = _deduplicate_overlaps(all_spans)

    return all_spans


def preload() -> None:
    """Pre-load spaCy models at startup."""
    _get_analyzer()
