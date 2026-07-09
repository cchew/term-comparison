# src/term_comparison/models.py
from __future__ import annotations

from pydantic import BaseModel


class DefinitionOut(BaseModel):
    display_term: str
    definition_text: str
    act_title: str
    act_frbr_uri: str
    section_eid: str


class ComparisonResponse(BaseModel):
    term: str
    definitions: list[DefinitionOut]
    difference_summary: str | None = None
