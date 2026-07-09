# scripts/verify_corpus.py
from __future__ import annotations
from pathlib import Path

from lexaugraph.graph import LexAuGraph
from lexaugraph.resolver import DefinitionResolver

GRAPH_PATH = Path(__file__).resolve().parents[3] / "lex-au-graph" / "repo" / "graph.json"

FLAGSHIP_TERMS = ["small business", "income support payment"]


def main() -> None:
    if not GRAPH_PATH.exists():
        raise SystemExit(f"graph.json not found at {GRAPH_PATH} — run 'lexaugraph build' in lex-au-graph/repo first.")

    graph = LexAuGraph.load(GRAPH_PATH)
    resolver = DefinitionResolver(graph)

    for term in FLAGSHIP_TERMS:
        results = resolver.find_all_definitions(term)
        print(f"\n=== '{term}' — {len(results)} definition(s) ===")
        for r in results:
            preview = r.definition_text[:200].replace("\n", " ")
            print(f"- {r.act_title} ({r.section_eid}): {preview}...")


if __name__ == "__main__":
    main()
