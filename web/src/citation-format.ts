// src/citation-format.ts
//
// Converts internal `section_eid` slugs (e.g. "part-II__dvs-1__sec-6") into
// human-readable legislative citations (e.g. "Pt II, Div 1, s 6"). The raw
// slug is a database identifier, not how a lawyer cites a section — showing
// it verbatim in the UI reads as a leak of internal implementation detail.
//
// Format: `__`-joined segments, each segment `{type}-{id}`. The `id` portion
// can itself contain hyphens (e.g. "part-6-5") or dots (e.g. "part-10.51") or
// roman numerals/letters (e.g. "part-VIA", "sec-71A") — so each segment is
// split on the FIRST hyphen only, never on every hyphen.
const TYPE_LABELS: Record<string, string> = {
  chapter: "Ch",
  part: "Pt",
  dvs: "Div",
  subdvs: "Subdiv",
  sec: "s",
};

export function formatSectionCitation(sectionEid: string): string {
  if (!sectionEid) return sectionEid;

  const segments = sectionEid.split("__");
  const parts: string[] = [];

  for (const segment of segments) {
    const hyphenIndex = segment.indexOf("-");
    if (hyphenIndex === -1) return sectionEid;

    const type = segment.slice(0, hyphenIndex);
    const id = segment.slice(hyphenIndex + 1);
    const label = TYPE_LABELS[type];
    if (!label || !id) return sectionEid;

    parts.push(`${label} ${id}`);
  }

  if (parts.length === 0) return sectionEid;
  return parts.join(", ");
}
