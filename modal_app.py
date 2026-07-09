# modal_app.py
from __future__ import annotations
from pathlib import Path

import modal

REPO_ROOT = Path(__file__).resolve().parent
LEX_AU_GRAPH_REPO = REPO_ROOT.parent.parent / "lex-au-graph" / "repo"
GRAPH_JSON = LEX_AU_GRAPH_REPO / "graph.json"

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("fastapi>=0.115", "networkx>=3.3", "lxml>=5.3")
    .add_local_python_source("lexaugraph")
    .add_local_python_source("term_comparison")
    .add_local_file(str(GRAPH_JSON), "/root/graph.json")
)

app = modal.App("term-comparison", image=image)


@app.function(min_containers=1)
@modal.asgi_app()
def fastapi_app():
    from pathlib import Path as _Path
    from lexaugraph.graph import LexAuGraph
    from lexaugraph.resolver import DefinitionResolver
    from term_comparison.api import create_app

    graph = LexAuGraph.load(_Path("/root/graph.json"))
    resolver = DefinitionResolver(graph)
    return create_app(resolver)
