// src/citation.ts
//
// Search-results URL, not a deep link to the specific section — precise
// legislation.gov.au deep links need new plumbing through lex-au's crawler and
// lex-au-graph's models, logged as a gated backlog item (lex-au/FUTURE.md,
// 2026-07-10 entry). This is the accepted trade-off for this entry.
//
// URL format verified against the live site (2026-07-12) by using its own
// search box and capturing the generated URL — NOT a `?text=` query param
// (that ignores the parameter and returns the unfiltered corpus). The site
// uses a path-segment DSL: /search/text("<title>",nameAndText,contains)/pointintime(Latest)
export function legislationSearchUrl(actTitle: string): string {
  return `https://www.legislation.gov.au/search/text(%22${encodeURIComponent(actTitle)}%22,nameAndText,contains)/pointintime(Latest)`;
}
