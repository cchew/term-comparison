# src/term_comparison/cli.py
from __future__ import annotations
from pathlib import Path

import click

DEFAULT_GRAPH = Path(__file__).resolve().parents[4] / "lex-au-graph" / "repo" / "graph.json"


@click.group()
def cli() -> None:
    pass


@cli.command()
@click.option(
    "--graph",
    default=DEFAULT_GRAPH,
    type=click.Path(exists=True, path_type=Path),
    show_default=True,
    help="Path to lex-au-graph's graph.json",
)
@click.option("--port", default=8000, show_default=True)
@click.option("--host", default="127.0.0.1", show_default=True)
def serve(graph: Path, port: int, host: str) -> None:
    """Run the term-comparison FastAPI server locally.

    If ANTHROPIC_API_KEY is set in the environment, the /definitions response
    includes a quote-verified difference summary; otherwise difference_summary
    stays null (no key required for local dev of the definitions-only path).
    """
    import os
    import uvicorn
    import anthropic
    from lexaugraph.graph import LexAuGraph
    from lexaugraph.resolver import DefinitionResolver
    from term_comparison.api import create_app

    g = LexAuGraph.load(graph)
    resolver = DefinitionResolver(g)
    client = anthropic.Anthropic() if os.environ.get("ANTHROPIC_API_KEY") else None
    app = create_app(resolver, client=client)
    uvicorn.run(app, host=host, port=port)
