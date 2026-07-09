# IM2026 Term-Comparison Tool

Innovation Month 2026 "Build a Bureaucrat Bot" entry. Shows how ordinary legal terms
(e.g. "small business", "income support payment") are defined differently across
different Commonwealth Acts, with citations. Built on `lex-au-graph`'s `DefinitionResolver`.

Full design spec: `../../../docs/superpowers/specs/2026-07-09-term-comparison-design.md`
(in the executive-assistant repo).

## Setup

    python -m venv .venv && source .venv/bin/activate
    pip install -e ".[dev]"
    pip install -e ../../lex-au-graph/repo

`lex-au-graph` is not published — it's installed editable from the sibling project
directory. Its own `graph.json` (built via `lexaugraph build`) must exist at
`../../lex-au-graph/repo/graph.json` before running this project.

## Run locally

    term-comparison serve

## Tests

    pytest
