# tests/test_llm.py
from __future__ import annotations

import json
from unittest.mock import MagicMock

from term_comparison.models import DefinitionOut
from term_comparison.llm import summarise_differences, verify_quote

DEF_A = DefinitionOut(
    display_term="personal information",
    definition_text="personal information means information about an identified individual.",
    act_title="Privacy Act 1988",
    act_frbr_uri="/akn/au/act/1988/119",
    section_eid="sec-6",
)

DEF_B = DefinitionOut(
    display_term="personal information",
    definition_text="personal information means information or an opinion about an identified individual, whether true or not.",
    act_title="My Health Records Act 2012",
    act_frbr_uri="/akn/au/act/2012/63",
    section_eid="sec-5",
)


def test_verify_quote_found():
    assert verify_quote("information about an identified individual", DEF_A.definition_text) is True


def test_verify_quote_not_found():
    assert verify_quote("this text is not present anywhere", DEF_A.definition_text) is False


def test_verify_quote_normalises_whitespace():
    assert verify_quote("information   about  an identified individual", DEF_A.definition_text) is True


def test_summarise_differences_returns_none_for_single_definition():
    mock_client = MagicMock()
    result = summarise_differences("personal information", [DEF_A], mock_client)
    assert result is None
    mock_client.messages.create.assert_not_called()


def test_summarise_differences_returns_summary_when_quotes_verify():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps({
        "summary": "One Act limits personal information to information, the other extends it to information or an opinion.",
        "differences": [
            {
                "act_title": "Privacy Act 1988",
                "quote": "information about an identified individual",
                "note": "narrower — excludes opinions",
            },
            {
                "act_title": "My Health Records Act 2012",
                "quote": "information or an opinion about an identified individual",
                "note": "broader — includes opinions",
            },
        ],
        "confidence": "high",
    }))]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    result = summarise_differences("personal information", [DEF_A, DEF_B], mock_client)

    assert result == "One Act limits personal information to information, the other extends it to information or an opinion."


def test_summarise_differences_returns_none_when_no_quotes_verify():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps({
        "summary": "Fabricated difference not grounded in the text.",
        "differences": [
            {"act_title": "Privacy Act 1988", "quote": "this exact phrase does not appear anywhere", "note": "made up"},
        ],
        "confidence": "high",
    }))]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    result = summarise_differences("personal information", [DEF_A, DEF_B], mock_client)

    assert result is None


def test_summarise_differences_returns_none_on_json_decode_error():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="not valid json")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    result = summarise_differences("personal information", [DEF_A, DEF_B], mock_client)

    assert result is None


def test_summarise_differences_strips_markdown_fences():
    payload = json.dumps({
        "summary": "Difference described here.",
        "differences": [
            {"act_title": "Privacy Act 1988", "quote": "information about an identified individual", "note": "narrower"},
        ],
        "confidence": "medium",
    })
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=f"```json\n{payload}\n```")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    result = summarise_differences("personal information", [DEF_A, DEF_B], mock_client)

    assert result == "Difference described here."
