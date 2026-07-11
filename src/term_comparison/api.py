# src/term_comparison/api.py
from __future__ import annotations

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from lexaugraph.resolver import DefinitionResolver

from term_comparison.llm import summarise_differences
from term_comparison.models import (
    ComparisonResponse,
    DefinitionOut,
    DifferenceOut,
    MultiActTermOut,
    StatsOut,
)


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
        diff_result = None
        if client is not None:
            try:
                diff_result = summarise_differences(term, definitions, client)
            except Exception:
                # The LLM summary is an enhancement, not the product. A failure here
                # (network error, SDK exception not subclassing anthropic.APIError,
                # malformed response, etc.) must never break the core definitions result.
                diff_result = None
        return ComparisonResponse(
            term=term,
            definitions=definitions,
            difference_summary=diff_result.summary if diff_result else None,
            differences=(
                [DifferenceOut(act_title=d.act_title, quote=d.quote, note=d.note) for d in diff_result.differences]
                if diff_result
                else []
            ),
        )

    @app.get("/stats", response_model=StatsOut)
    def get_stats() -> StatsOut:
        return StatsOut(
            acts=resolver.count_acts(),
            defined_terms=resolver.count_valid_defined_terms(),
            multi_act_terms=len(resolver.list_multi_act_terms(min_acts=3)),
        )

    @app.get("/terms", response_model=list[MultiActTermOut])
    def get_terms(min_acts: int = 3) -> list[MultiActTermOut]:
        return [
            MultiActTermOut(term=t.term, display_term=t.display_term, act_count=t.act_count)
            for t in resolver.list_multi_act_terms(min_acts=min_acts)
        ]

    return app
