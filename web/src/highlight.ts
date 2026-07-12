// src/highlight.ts
//
// Ports llm.py's verify_quote normalise-then-locate matching logic to TypeScript,
// so DefinitionPanel's quote highlighting and the backend's quote verification stay
// consistent. Unlike verify_quote (a boolean check on normalised strings), this
// needs to report *where* the match is in the original text, so it builds a
// whitespace/punctuation-tolerant regex from the quote's words and matches that
// against the original (non-normalised) source text directly.

export function normaliseForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findQuoteSpan(quote: string, sourceText: string): { start: number; end: number } | null {
  const words = normaliseForMatch(quote).split(" ").filter(Boolean);
  if (words.length === 0) return null;

  // The joiner [^\p{L}\p{N}]+ matches any run of punctuation/whitespace (including newlines, no length bound), allowing matches across structural gaps (list markers, semicolons); it cannot skip real words. Quotes are pre-verified server-side before reaching this function. Unicode-aware to handle accented letters and non-ASCII digits (e.g. "café").
  const pattern = words.map(escapeRegExp).join("[^\\p{L}\\p{N}]+");
  const match = new RegExp(pattern, "iu").exec(sourceText);
  if (!match) return null;

  return { start: match.index, end: match.index + match[0].length };
}
