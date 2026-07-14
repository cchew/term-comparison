# Deploy Corrected Definitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Confirm `term-comparison` correctly surfaces complete definitions and same-Act multi-meaning results once the upstream `lex-au`/`lex-au-graph` fixes land, fix one piece of now-stale user-facing copy the spec didn't anticipate, and deploy.

**Architecture:** `DefinitionOut`/`ComparisonResponse` are already list-shaped and occurrence-scoped — confirmed no backend schema change is needed. Two regression tests prove the API layer behaves correctly once the upstream data is fixed. One real UI copy fix was found while verifying the spec's "no code change" claim against the actual frontend: `AboutModal.vue`'s "Known limitations" list currently tells users about the exact bug this cross-repo effort fixes — that line needs removing, not just leaving stale.

**Tech Stack:** Python 3.12 (FastAPI backend), Vue 3 + TypeScript (frontend), pytest, Playwright. No new dependencies.

**Dependency chain:** `lex-au`'s corpus fix → `lex-au-graph`'s node_id MVP + rebuild (`graph.json` regenerated) → this plan. Note `term-comparison` depends on `lex-au-graph` directly (`graph.json`, loaded via `scripts/verify_corpus.py`'s `GRAPH_PATH`), not on `lex-au-search` — those are independent, parallel consumers of the same corpus. **Do not start Task 2 or Task 4 until `lex-au-graph`'s rebuild (its own plan's Task 4) is confirmed done** — Task 1 and Task 3 have no such dependency and can run immediately.

## Global Constraints

- Backend: Python ≥ 3.12. Run with `pytest` from the repo root (venv: `source .venv/bin/activate`).
- Frontend: Node, `web/` subdirectory. Run with `npm test` (unit) and `npx playwright test` (e2e) from `web/`.
- Full spec: `../../lex-au/repo/docs/superpowers/specs/2026-07-14-list-definition-truncation-design.md`.
- Commit after every task using `caveman-commit` conventions.
- E2E precondition (existing convention, `web/tests/e2e.spec.ts` header comment): backend must be started manually first — `source .venv/bin/activate && export $(grep ANTHROPIC_API_KEY .env) && term-comparison serve`. Playwright's `webServer` config only manages the frontend dev server.
- Deploy step (Task 5) uses this project's existing, established deploy process — do not fabricate a new one. If unclear at execution time, ask rather than guess.

---

## Task 1: Backend regression — fallback summary no longer fires for completed definitions

**Files:**
- Test: `tests/test_api.py`

**Interfaces:**
- Consumes: `_fallback_summary`, `_is_bare_fragment` (existing, `src/term_comparison/api.py:22-52`) — pure functions, no live corpus/graph dependency, so this task has no upstream dependency and can run immediately.

### Step 1: Write the failing test

Add to `tests/test_api.py`, after `test_get_definitions_fallback_summary_all_fragments` (after line 341):

```python
def test_fallback_summary_no_longer_fires_for_completed_definitions():
    """Regression for the list-definition-truncation fix: once definition_text
    is complete (contains real list content, not just a bare colon-terminated
    lead-in), _fallback_summary must return the normal distinct-count message,
    not the 'wasn't extracted' fallback. _is_bare_fragment's regex only matches
    the exact bare fragment shape ("the following:" / "any of the following:"),
    so this is a pure-function test proving no term-comparison code change is
    needed once the upstream corpus fix lands -- no live corpus/graph needed."""
    from term_comparison.api import _fallback_summary
    from term_comparison.models import DefinitionOut

    definitions = [
        DefinitionOut(
            display_term="entity",
            definition_text=(
                "any of the following: (a) an individual; (b) a body corporate; "
                "(c) a body politic; (d) a partnership;"
            ),
            act_title="Income Tax Assessment Act 1997",
            act_frbr_uri="/akn/au/act/1997/38",
            section_eid="sec-995-1",
        ),
        DefinitionOut(
            display_term="entity",
            definition_text=(
                "the following: (a) an individual; (b) a body corporate; (c) a trust;"
            ),
            act_title="A New Tax System (Goods and Services Tax) Act 1999",
            act_frbr_uri="/akn/au/act/1999/85",
            section_eid="sec-195-1",
        ),
    ]

    summary = _fallback_summary(definitions)
    assert summary == "2 distinct definition texts found across 2 Acts — see below."
```

### Step 2: Run test to verify it passes (no implementation change expected)

Run: `python -m pytest tests/test_api.py -k fallback_summary_no_longer_fires -v`
Expected: PASS immediately — this proves the claim, it doesn't require a fix. If it fails, `_is_bare_fragment`'s regex is matching more broadly than `^(any of )?the following:$` against these longer strings, which would be a real bug in the existing fallback logic to investigate before proceeding (not expected, but don't skip verifying it PASSES for the right reason).

### Step 3: Run full suite, then commit

Run: `python -m pytest -q`
Expected: all pass, plus 1 new.

```bash
git add tests/test_api.py
git commit -m "test: confirm fallback summary logic needs no change"
```

---

## Task 2: Backend regression — same-Act multi-meaning definitions

**Files:**
- Test: `tests/test_api.py`

**Interfaces:**
- Consumes: `lexaugraph.graph.LexAuGraph.add_act_data`, `lexaugraph.resolver.DefinitionResolver.find_all_definitions` — requires `lex-au-graph`'s node_id MVP fix to be installed (`pip install -e ../../lex-au-graph/repo` or equivalent, per this repo's editable-dependency convention).

**Blocked until `lex-au-graph`'s node_id MVP (Tasks 1-2 of its own plan) is merged and reinstalled in this repo's venv.** Without it, `graph.add_act_data` silently overwrites the second `DefinedTermNode` and this test fails with `len(data["definitions"]) == 1`, not 2 — that failure mode is expected and correct *before* the dependency lands; don't attempt to fix it here.

### Step 1: Write the failing test

Add to `tests/test_api.py`, after the new test from Task 1:

```python
def _build_multi_meaning_resolver() -> DefinitionResolver:
    """One Act, one term, two genuinely different meanings -- the node_id MVP
    scenario (e.g. ITAA 1936's real 'exempt income', which has 4 distinct
    meanings in the live corpus). Requires lex-au-graph's occurrence-
    disambiguated node_id for both DefinedTermNodes to survive as separate
    graph nodes -- this fixture directly exercises that."""
    graph = LexAuGraph()
    act = ActData(
        act_node=ActNode(frbr_uri="/akn/au/act/1936/27", title="Income Tax Assessment Act 1936", year=1936),
        sections=[
            SectionNode(
                eid="part-III__sec-23",
                act_frbr_uri="/akn/au/act/1936/27",
                heading="Exemptions",
                text="exempt income means ...",
            ),
        ],
        defined_terms=[
            DefinedTermNode(
                term="exempt income",
                display_term="exempt income",
                act_frbr_uri="/akn/au/act/1936/27",
                section_eid="part-III__sec-23",
                definition_text="income derived from a source outside Australia by a resident.",
            ),
            DefinedTermNode(
                term="exempt income",
                display_term="exempt income",
                act_frbr_uri="/akn/au/act/1936/27",
                section_eid="part-III__sec-23",
                definition_text="a pension, allowance or benefit specified in Schedule 5.",
            ),
        ],
        ref_edges=[],
    )
    graph.add_act_data(act)
    return DefinitionResolver(graph)


def test_get_definitions_returns_multiple_meanings_same_act():
    """Regression for the node_id MVP fix: a term with 2 genuinely different
    meanings within ONE Act must return both, not silently show only one."""
    resolver = _build_multi_meaning_resolver()
    app = create_app(resolver)
    client = TestClient(app)

    response = client.get("/definitions", params={"term": "exempt income"})

    assert response.status_code == 200
    data = response.json()
    assert len(data["definitions"]) == 2
    act_titles = {d["act_title"] for d in data["definitions"]}
    assert act_titles == {"Income Tax Assessment Act 1936"}
    def_texts = {d["definition_text"] for d in data["definitions"]}
    assert "income derived from a source outside Australia by a resident." in def_texts
    assert "a pension, allowance or benefit specified in Schedule 5." in def_texts
```

### Step 2: Run test to verify it fails (before the dependency lands) or passes (after)

Run: `python -m pytest tests/test_api.py -k multiple_meanings_same_act -v`
Expected: FAIL with `assert 1 == 2` if `lex-au-graph`'s node_id fix isn't installed yet; PASS once it is. Do not proceed past this step until it passes for the right reason (confirm by checking `pip show lexaugraph` or re-running `pip install -e ../../lex-au-graph/repo` if in doubt).

### Step 3: Run full suite, then commit

Run: `python -m pytest -q`
Expected: all pass, plus 1 new.

```bash
git add tests/test_api.py
git commit -m "test: confirm same-Act multi-meaning definitions surface"
```

---

## Task 3: Remove stale "paragraph-list" known-limitation copy

**Files:**
- Modify: `web/src/components/AboutModal.vue:45-51`

**Interfaces:** none — pure UI copy change, no dependency on the upstream fixes landing (safe to do immediately, but logically belongs after the fix is confirmed working end to end — sequence it last among the no-dependency tasks so it isn't shipped prematurely if the upstream fix stalls).

### Step 1: Remove the stale limitation

In `web/src/components/AboutModal.vue`, the "Known limitations" section currently reads (lines 45-51):

```html
      <section class="modal-section">
        <h2>Known limitations</h2>
        <ul>
          <li><strong>Corpus coverage.</strong> Some Acts' definitions haven't been extracted yet by the underlying legislation pipeline. A "no results" response means the term isn't tagged in the corpus yet — not that it's undefined in Australian law.</li>
          <li><strong>Paragraph-list definitions.</strong> Some definitions written as a list ("(a)... (b)... (c)...") currently extract only the lead-in phrase, not the full list content.</li>
        </ul>
      </section>
```

This second `<li>` describes exactly the bug the cross-repo fix addresses — leaving it in place after the fix ships would tell users about a limitation that no longer exists. Change to:

```html
      <section class="modal-section">
        <h2>Known limitations</h2>
        <ul>
          <li><strong>Corpus coverage.</strong> Some Acts' definitions haven't been extracted yet by the underlying legislation pipeline. A "no results" response means the term isn't tagged in the corpus yet — not that it's undefined in Australian law.</li>
        </ul>
      </section>
```

### Step 2: Confirm no test asserts the removed copy

Run: `grep -rn "Paragraph-list\|lead-in phrase" web/tests/ web/src/`
Expected: no matches (confirmed clean before this task was written — no test currently references this text, so removal is safe).

### Step 3: Run frontend unit tests, then commit

Run (from `web/`): `npm test`
Expected: all existing tests pass (no test covered this copy, so no test count change).

```bash
git add web/src/components/AboutModal.vue
git commit -m "fix: remove stale paragraph-list known-limitation copy"
```

---

## Task 4: Frontend E2E regression — longer/multi-item definitions render correctly

**Files:**
- Modify: `web/tests/e2e.spec.ts`

**Interfaces:** requires a live backend (per this repo's existing e2e precondition) pointed at the corrected corpus — i.e. `lex-au-graph`'s rebuilt `graph.json` must be in place. Same dependency as Task 2.

### Step 1: Add the regression test

Add to `web/tests/e2e.spec.ts`, inside the existing `test.describe("Term comparison — flagship terms", ...)` block, after the "searching an unknown term" test:

```typescript
  test("a previously-truncated list-form definition now shows full content", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.locator(".search-input").fill("entity");
    await page.locator(".search-btn").click();
    await page.waitForSelector(".definition-card", { timeout: 30000 });
    const cards = page.locator(".definition-card");
    expect(await cards.count()).toBeGreaterThan(0);
    const firstCardText = await cards.first().innerText();
    // Before the fix, this card's definition text was a bare fragment
    // ending in "the following:" with nothing after it. Confirm real list
    // content is now present and visible, not clipped.
    expect(firstCardText.trim().endsWith("the following:")).toBe(false);
    expect(firstCardText.length).toBeGreaterThan(60);
  });
```

### Step 2: Run it

Precondition: start the backend first (separate terminal): `source .venv/bin/activate && export $(grep ANTHROPIC_API_KEY .env) && term-comparison serve`

Run (from `web/`): `npx playwright test e2e.spec.ts -g "previously-truncated"`
Expected: PASS. If it fails with the card text still ending in "the following:", the backend is pointed at a stale `graph.json` — confirm `lex-au-graph`'s rebuild actually landed and the `term-comparison serve` process was restarted after it did (a running process won't pick up a `graph.json` rebuilt after it started).

### Step 3: Run full e2e suite, then commit

Run (from `web/`): `npx playwright test`
Expected: all existing e2e tests still pass, plus 1 new.

```bash
git add web/tests/e2e.spec.ts
git commit -m "test: add e2e regression for completed list definitions"
```

---

## Task 5: Deploy

**Files:** none — deployment only, using this project's existing, established process (Modal backend + Netlify frontend, per prior decisions logged in the EA workspace's `decisions/log.md`). This plan does not re-derive or fabricate deploy commands — if the exact current commands aren't obvious at execution time, check `README.md` and any existing deploy scripts first, and ask rather than guess.

### Step 1: Confirm all prior tasks passed

Run: `python -m pytest -q` (backend) and `npx playwright test` (frontend, from `web/`, with backend running).
Expected: full green — this is the go/no-go gate before touching the deployed instance.

### Step 2: Deploy

Follow the project's existing deploy process for the backend and frontend. Do not proceed without explicit user go-ahead — deploying overwrites the live "Act Alike" instance other people may be using.

### Step 3: Post-deploy smoke check

Against the live URL (not localhost): search "entity", confirm the returned definition text is complete (not ending in a bare "the following:"/"any of the following:" fragment), and open the "How this works" modal to confirm the paragraph-list limitation line (Task 3) is gone from the live site.

**STOP POINT.** This is the final task in the chain — report the smoke check result and stop.
