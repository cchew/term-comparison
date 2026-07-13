// src/crossref.ts
//
// Detects when a definition's text is not a real definition at all, but a
// cross-reference to another Act's definition of the same term (e.g.
// "in the Privacy Act 1988."). The backend's find_all_definitions returns
// these with no distinguishing flag, so this is a client-side heuristic
// applied to definition_text alone.

// Captures an Act-name-and-year pattern: an initial word starting with an
// uppercase letter or "(" (so parenthetical Act names like "A New Tax System
// (Family Assistance) Act 1999" still match on the "(Family" token, and a
// bare leading digit — e.g. "6" in "section 6 of the Privacy Act 1988" —
// can't itself anchor the match), followed by up to 7 more words that are
// each either uppercase/digit/"("-started OR the connector "and" (official
// Act titles routinely embed it mid-name, e.g. "Australian Charities and
// Not-for-profits Commission Act 2012"), ending in "Act" + a 4-digit year.
//
// "of"/"the" were tried as connectors too (per the original FUTURE.md note)
// but rejected: they're common enough as ordinary filler that they bridge
// through unrelated preceding text on real corpus data — e.g. "in Chapter 2E
// of the Corporations Act 2001" would wrongly capture "Chapter 2E of the
// Corporations Act 2001" instead of just "Corporations Act 2001". Known
// residual gap: a genuine Act title containing "of" (e.g. "Members of
// Parliament (Staff) Act 1984") still truncates to "Parliament (Staff) Act
// 1984" — same as before this fix, not a new regression.
const ACT_NAME_PATTERN =
  /([A-Z(][\w'()-]*\s+(?:(?:[A-Z0-9(][\w'()-]*|and)\s+){0,7}Act\s+\d{4})/;

// The regex has no positional anchor, so it also matches a genuine, longer
// definition that happens to cite another Act mid-sentence (e.g. "an offence
// under section 5 of the Crimes Act 1914"). Every confirmed real cross-reference
// in the live corpus is <=71 chars; the shortest confirmed genuine definition
// is 106 chars. 100 sits between the two with headroom on both sides.
const MAX_CROSS_REFERENCE_LENGTH = 100;

export function detectCrossReference(definitionText: string, ownActTitle: string): string | null {
  if (definitionText.length > MAX_CROSS_REFERENCE_LENGTH) return null;

  const match = ACT_NAME_PATTERN.exec(definitionText);
  if (!match) return null;

  const referencedAct = match[1]!.trim().replace(/\s+/g, " ");
  if (referencedAct === ownActTitle) return null;

  return referencedAct;
}

// Connector words that carry no information once the referenced Act's name has
// been stripped out — "in the Privacy Act 1988." reduces to nothing but these.
const CROSS_REFERENCE_STOPWORDS = new Set(["in", "the", "it", "has", "of", "a", "an"]);

// Returns the raw definition text only when it says more than the synthesized
// "Adopts the definition from X" note already does (e.g. a specific section
// citation) — otherwise the two lines are the same fact twice.
export function crossReferenceDetail(definitionText: string, referencedAct: string): string | null {
  const withoutAct = definitionText.replace(referencedAct, "");
  const remainingWords = withoutAct
    .split(/[^\w]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 0 && !CROSS_REFERENCE_STOPWORDS.has(w));
  return remainingWords.length > 0 ? definitionText : null;
}
