"""Replacement planner: deterministic placeholder generation & one-pass replacement."""

import re
from collections import defaultdict

from backend.models.mapping import EntitySpan, MappingEntry


_PLACEHOLDER_RE = re.compile(r"<[A-Z]+_\d{3}>")


def _generate_placeholder(entity_type: str, index: int) -> str:
    """Generate a zero-padded placeholder token."""
    return f"<{entity_type}_{index:03d}>"


def _find_all_occurrences(text: str, substring: str) -> list[tuple[int, int]]:
    """Find all non-overlapping occurrences of substring in text."""
    results: list[tuple[int, int]] = []
    start = 0
    while True:
        idx = text.find(substring, start)
        if idx == -1:
            break
        results.append((idx, idx + len(substring)))
        start = idx + len(substring)
    return results


def _resolve_overlaps(
    spans: list[tuple[int, int, str]],
) -> list[tuple[int, int, str]]:
    """Resolve overlapping spans: longer span wins; on tie, earlier start wins."""
    if not spans:
        return []

    # Sort by start position, then by descending length
    sorted_spans = sorted(spans, key=lambda s: (s[0], -(s[1] - s[0])))
    result: list[tuple[int, int, str]] = [sorted_spans[0]]

    for span in sorted_spans[1:]:
        prev = result[-1]
        if span[0] < prev[1]:
            # Overlap: keep the longer one
            prev_len = prev[1] - prev[0]
            curr_len = span[1] - span[0]
            if curr_len > prev_len:
                result[-1] = span
            # Otherwise keep prev (earlier or same length)
        else:
            result.append(span)

    return result


def build_replacement_plan(
    text: str,
    entities: list[EntitySpan],
) -> tuple[str, list[MappingEntry]]:
    """Build a deterministic replacement plan and apply it.

    Algorithm:
    1. Deduplicate entities by (text, entity_type) → same value always gets same placeholder
    2. Assign per-type counters for placeholder numbering
    3. Find ALL occurrences of each entity text in the full document
    4. Resolve overlapping spans (longer wins)
    5. One-pass replace from end to start to preserve positions
    6. Check for placeholder collisions in original text

    Returns:
        (anonymized_text, mapping_entries)
    """
    if not entities:
        return text, []

    # Step 1: Deduplicate by (text, entity_type)
    unique_entities: dict[tuple[str, str], EntitySpan] = {}
    for entity in entities:
        key = (entity.text, entity.entity_type)
        if key not in unique_entities:
            unique_entities[key] = entity

    # Step 2: Assign placeholders with per-type counters
    type_counters: dict[str, int] = defaultdict(int)
    entity_to_placeholder: dict[tuple[str, str], str] = {}

    # Check for existing placeholder-like patterns in the original text
    existing_placeholders = set(_PLACEHOLDER_RE.findall(text))

    for key in unique_entities:
        entity_text, entity_type = key
        type_counters[entity_type] += 1
        placeholder = _generate_placeholder(entity_type, type_counters[entity_type])

        # Collision check: if placeholder already exists in source, bump counter
        while placeholder in existing_placeholders:
            type_counters[entity_type] += 1
            placeholder = _generate_placeholder(entity_type, type_counters[entity_type])

        entity_to_placeholder[key] = placeholder

    # Step 3: Find ALL occurrences of each entity text in the document
    all_spans: list[tuple[int, int, str]] = []
    for (entity_text, entity_type), placeholder in entity_to_placeholder.items():
        occurrences = _find_all_occurrences(text, entity_text)
        for start, end in occurrences:
            all_spans.append((start, end, placeholder))

    # Step 4: Resolve overlaps
    all_spans = _resolve_overlaps(all_spans)

    # Step 5: One-pass replacement (end to start)
    all_spans.sort(key=lambda s: s[0], reverse=True)
    result = text
    for start, end, placeholder in all_spans:
        result = result[:start] + placeholder + result[end:]

    # Step 6: Build mapping entries
    mapping: list[MappingEntry] = []
    for (entity_text, entity_type), placeholder in entity_to_placeholder.items():
        mapping.append(
            MappingEntry(
                placeholder=placeholder,
                original=entity_text,
                entity_type=entity_type,
            )
        )

    return result, mapping
