# IM2026 Term-Comparison Tool

Innovation Month 2026 "Build a Bureaucrat Bot" entry. Shows how ordinary legal terms
(e.g. "small business", "income support payment") are defined differently across
different Commonwealth Acts, with citations. Built on `lex-au-graph`'s `DefinitionResolver`.

Full design spec: `../../../docs/superpowers/specs/2026-07-09-term-comparison-design.md`
(in the executive-assistant repo).

## Stack position

Sits on top of the AU Legislative Intelligence Stack:

```
Layer 1: lex-au          — https://github.com/cchew/lex-au (MIT) — AKN 3.0 XML corpus
Layer 2.5: lex-au-graph  — https://github.com/cchew/lex-au-graph (MIT) — cross-reference graph + definition resolution
This repo               — thin FastAPI wrapper around lex-au-graph's DefinitionResolver
```

`lex-au-graph` is a direct runtime dependency (installed editable, not vendored) and
its `graph.json` — built from the `lex-au` corpus — is required before this service
can serve real data. See `../../lex-au-graph/repo/README.md` for how to build it.

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

## License

MIT — see [LICENSE](LICENSE).
