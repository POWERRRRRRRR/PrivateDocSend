"""Restore engine: exact token replacement from mapping."""

import re

from backend.models.mapping import MappingEntry


_PLACEHOLDER_RE = re.compile(r"<[A-Z]+_\d{3}>")


def restore_text(
    text: str,
    mapping: list[MappingEntry],
) -> tuple[str, list[str]]:
    """Restore placeholders in text to their original values.

    Uses exact string replacement only — no fuzzy matching.
    Processes longer placeholders first to prevent partial matches.

    Returns:
        (restored_text, list_of_unreplaced_placeholders)
    """
    if not mapping:
        return text, []

    # Sort by placeholder length descending to prevent partial matches
    sorted_mapping = sorted(mapping, key=lambda m: len(m.placeholder), reverse=True)

    result = text
    for entry in sorted_mapping:
        result = result.replace(entry.placeholder, entry.original)

    # Check for any remaining unreplaced placeholders
    unreplaced = _PLACEHOLDER_RE.findall(result)

    return result, unreplaced
