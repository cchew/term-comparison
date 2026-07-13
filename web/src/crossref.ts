// src/crossref.ts
//
// Detects when a definition's text is not a real definition at all, but a
// cross-reference to another Act's definition of the same term (e.g.
// "in the Privacy Act 1988."). The backend's find_all_definitions returns
// these with no distinguishing flag, so this is a client-side heuristic
// applied to definition_text alone.

// Captures an Act-name-and-year pattern: a run of 1-8 "words" (each starting
// with an uppercase letter, digit, or "(" so parenthetical Act names like
// "A New Tax System (Family Assistance) Act 1999" still match on the
// "(Family" token) followed by whitespace, ending in "Act" + a 4-digit year.
const ACT_NAME_PATTERN = /((?:[A-Z0-9(][\w'()-]*\s+){1,8}Act\s+\d{4})/;

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
