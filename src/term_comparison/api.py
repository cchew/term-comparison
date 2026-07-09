# src/term_comparison/api.py
from __future__ import annotations

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from lexaugraph.resolver import DefinitionResolver

from term_comparison.llm import summarise_differences
from term_comparison.models import ComparisonResponse, DefinitionOut


def create_app(resolver: DefinitionResolver, client: anthropic.Anthropic | None = None) -> FastAPI:
    app = FastAPI(title="term-comparison", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/definitions", response_model=ComparisonResponse)
    def get_definitions(term: str) -> ComparisonResponse:
        results = resolver.find_all_definitions(term)
        if not results:
            raise HTTPException(status_code=404, detail=f"No definitions found for '{term}'")
        definitions = [
            DefinitionOut(
                display_term=r.display_term,
                definition_text=r.definition_text,
                act_title=r.act_title,
                act_frbr_uri=r.act_frbr_uri,
                section_eid=r.section_eid,
            )
            for r in results
        ]
        difference_summary = (
            summarise_differences(term, definitions, client) if client is not None else None
        )
        return ComparisonResponse(
            term=term,
            definitions=definitions,
            difference_summary=difference_summary,
        )

    return app
