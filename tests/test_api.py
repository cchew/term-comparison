# tests/test_api.py
from __future__ import annotations

import json
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from lexaugraph.graph import LexAuGraph
from lexaugraph.models import ActData, ActNode, DefinedTermNode, SectionNode
from lexaugraph.resolver import DefinitionResolver

from term_comparison.api import create_app


def _build_test_resolver() -> DefinitionResolver:
    graph = LexAuGraph()

    act_a = ActData(
        act_node=ActNode(frbr_uri="/akn/au/act/1991/46", title="Social Security Act 1991", year=1991),
        sections=[
            SectionNode(
                eid="sec-1020",
                act_frbr_uri="/akn/au/act/1991/46",
                heading="Income support payment",
                text="income support payment means a social security benefit or a social security pension.",
            ),
        ],
        defined_terms=[
            DefinedTermNode(
                term="income support payment",
                display_term="income support payment",
                act_frbr_uri="/akn/au/act/1991/46",
                section_eid="sec-1020",
                definition_text="a social security benefit or a social security pension.",
            ),
        ],
        ref_edges=[],
    )

    act_b = ActData(
        act_node=ActNode(
            frbr_uri="/akn/au/act/1993/78",
            title="Superannuation Industry (Supervision) Act 1993",
            year=1993,
        ),
        sections=[
            SectionNode(
                eid="sec-10",
                act_frbr_uri="/akn/au/act/1993/78",
                heading="Definitions",
                text="income support payment has the same meaning as in the Social Security Act 1991.",
            ),
        ],
        defined_terms=[
            DefinedTermNode(
                term="income support payment",
                display_term="income support payment",
                act_frbr_uri="/akn/au/act/1993/78",
                section_eid="sec-10",
                definition_text="has the same meaning as in the Social Security Act 1991.",
            ),
        ],
        ref_edges=[],
    )

    graph.add_act_data(act_a)
    graph.add_act_data(act_b)
    return DefinitionResolver(graph)


def test_get_definitions_returns_all_acts_for_term():
    resolver = _build_test_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "income support payment"})

    assert response.status_code == 200
    data = response.json()
    assert data["term"] == "income support payment"
    assert len(data["definitions"]) == 2
    act_titles = {d["act_title"] for d in data["definitions"]}
    assert act_titles == {
        "Social Security Act 1991",
        "Superannuation Industry (Supervision) Act 1993",
    }
    assert data["difference_summary"] is None


def test_get_definitions_404_for_unknown_term():
    resolver = _build_test_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "nonexistent term"})

    assert response.status_code == 404


def test_get_definitions_populates_difference_summary_with_client():
    resolver = _build_test_resolver()
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps({
        "summary": "The Acts describe the same payment concept in different words.",
        "differences": [
            {
                "act_title": "Social Security Act 1991",
                "quote": "a social security benefit or a social security pension",
                "note": "defines the concept directly",
            },
        ],
        "confidence": "high",
    }))]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    app = create_app(resolver, client=mock_client)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "income support payment"})

    assert response.status_code == 200
    data = response.json()
    assert data["difference_summary"] == "The Acts describe the same payment concept in different words."


def test_get_definitions_difference_summary_none_without_client():
    resolver = _build_test_resolver()
    app = create_app(resolver)  # no client — default behaviour, unchanged from before this task
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "income support payment"})

    assert response.json()["difference_summary"] is None


def test_get_definitions_survives_unexpected_llm_exception():
    """A summary-layer failure must never take down the whole /definitions response.

    llm.py's summarise_differences only catches anthropic.APIError internally. This
    test raises a bare ValueError from the mocked client — something llm.py does NOT
    catch — to prove the defensive catch added at the API boundary (not inside
    llm.py) actually works, rather than merely re-exercising llm.py's own handling.
    """
    resolver = _build_test_resolver()
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = ValueError("unexpected failure, not an APIError")

    app = create_app(resolver, client=mock_client)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "income support payment"})

    assert response.status_code == 200
    data = response.json()
    assert len(data["definitions"]) == 2
    act_titles = {d["act_title"] for d in data["definitions"]}
    assert act_titles == {
        "Social Security Act 1991",
        "Superannuation Industry (Supervision) Act 1993",
    }
    assert data["difference_summary"] is None


def test_get_definitions_populates_differences_with_client():
    resolver = _build_test_resolver()
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps({
        "summary": "The Acts describe the same payment concept in different words.",
        "differences": [
            {
                "act_title": "Social Security Act 1991",
                "quote": "a social security benefit or a social security pension",
                "note": "defines the concept directly",
            },
        ],
        "confidence": "high",
    }))]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    app = create_app(resolver, client=mock_client)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "income support payment"})

    assert response.status_code == 200
    data = response.json()
    assert data["differences"] == [
        {
            "act_title": "Social Security Act 1991",
            "quote": "a social security benefit or a social security pension",
            "note": "defines the concept directly",
        }
    ]


def test_get_definitions_differences_empty_without_client():
    resolver = _build_test_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "income support payment"})

    assert response.json()["differences"] == []


def test_get_stats_returns_live_counts():
    resolver = _build_test_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/stats")

    assert response.status_code == 200
    data = response.json()
    assert data["acts"] == 2
    assert data["defined_terms"] == 2
    assert data["multi_act_terms"] == 0  # "income support payment" is defined in 2 Acts, below the min_acts=3 default


def test_get_terms_returns_multi_act_terms_above_threshold():
    resolver = _build_test_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/terms", params={"min_acts": 2})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["term"] == "income support payment"
    assert data[0]["act_count"] == 2


def test_get_terms_default_min_acts_excludes_two_act_term():
    resolver = _build_test_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/terms")

    assert response.status_code == 200
    assert response.json() == []
