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

export function detectCrossReference(definitionText: string, ownActTitle: string): string | null {
  const match = ACT_NAME_PATTERN.exec(definitionText);
  if (!match) return null;

  const referencedAct = match[1]!.trim().replace(/\s+/g, " ");
  if (referencedAct === ownActTitle) return null;

  return referencedAct;
}
