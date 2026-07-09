# IM2026 Term-Comparison Tool

Backend for the IM2026 "Build a Bureaucrat Bot" entry. Wraps `lex-au-graph`'s
`DefinitionResolver` in a FastAPI service — see `README.md` for setup.

## Stack position

Depends on `../../lex-au-graph/repo` (Layer 2.5 of the AU Legislative Intelligence
Stack) — installed editable, not vendored. Its `graph.json` must be built first.

## Running locally

    source .venv/bin/activate
    term-comparison serve

## Tests

    pytest
