// tests/citation-format.test.ts
import { describe, it, expect } from "vitest";
import { formatSectionCitation } from "../src/citation-format";

describe("formatSectionCitation", () => {
  it("formats part, division, and section", () => {
    expect(formatSectionCitation("part-II__dvs-1__sec-6")).toBe("Pt II, Div 1, s 6");
  });

  it("formats chapter, dotted part, and section", () => {
    expect(formatSectionCitation("chapter-10__part-10.51__sec-1678")).toBe("Ch 10, Pt 10.51, s 1678");
  });

  it("formats chapter, dotted part, division, and dotted section", () => {
    expect(formatSectionCitation("chapter-9__part-9.10__dvs-395__sec-395.2")).toBe(
      "Ch 9, Pt 9.10, Div 395, s 395.2"
    );
  });

  it("formats part, division, subdivision, and section", () => {
    expect(formatSectionCitation("part-1__dvs-3__subdvs-1__sec-4")).toBe("Pt 1, Div 3, Subdiv 1, s 4");
  });

  it("formats roman numeral part and section", () => {
    expect(formatSectionCitation("part-I__sec-4")).toBe("Pt I, s 4");
  });

  it("formats chapter and section only", () => {
    expect(formatSectionCitation("chapter-1__sec-3")).toBe("Ch 1, s 3");
  });

  it("formats a part with roman-plus-letter id, division, and lettered section", () => {
    expect(formatSectionCitation("part-VIA__dvs-1__sec-71A")).toBe("Pt VIA, Div 1, s 71A");
  });

  it("formats hyphenated part and section ids without over-splitting", () => {
    expect(formatSectionCitation("chapter-6__part-6-5__dvs-995__sec-995-1")).toBe(
      "Ch 6, Pt 6-5, Div 995, s 995-1"
    );
  });

  it("formats a roman numeral part with double-letter form, division, and section", () => {
    expect(formatSectionCitation("part-XX__dvs-1__sec-287")).toBe("Pt XX, Div 1, s 287");
  });

  it("falls back to the raw string for an unrecognized segment type", () => {
    expect(formatSectionCitation("totally-unknown-format")).toBe("totally-unknown-format");
  });

  it("falls back to the raw string for an empty input", () => {
    expect(formatSectionCitation("")).toBe("");
  });
});
