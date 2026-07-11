// tests/highlight.test.ts
import { describe, it, expect } from "vitest";
import { normaliseForMatch, findQuoteSpan } from "../src/highlight";

describe("normaliseForMatch", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normaliseForMatch("Information,  about an identified individual.")).toBe(
      "information about an identified individual"
    );
  });
});

describe("findQuoteSpan", () => {
  const SOURCE = "personal information means information about an identified individual.";

  it("finds an exact substring match", () => {
    const span = findQuoteSpan("information about an identified individual", SOURCE);
    expect(span).not.toBeNull();
    expect(SOURCE.slice(span!.start, span!.end)).toBe("information about an identified individual");
  });

  it("finds a match despite whitespace/punctuation differences in the quote", () => {
    const span = findQuoteSpan("information,   about  an identified individual", SOURCE);
    expect(span).not.toBeNull();
    expect(SOURCE.slice(span!.start, span!.end).toLowerCase()).toContain("information about an identified individual");
  });

  it("is case-insensitive", () => {
    const span = findQuoteSpan("INFORMATION ABOUT AN IDENTIFIED INDIVIDUAL", SOURCE);
    expect(span).not.toBeNull();
  });

  it("returns null when the quote is not present", () => {
    const span = findQuoteSpan("this exact phrase does not appear anywhere", SOURCE);
    expect(span).toBeNull();
  });

  it("returns null for an empty quote", () => {
    expect(findQuoteSpan("", SOURCE)).toBeNull();
  });

  it("matches quote words separated only by punctuation/whitespace (structural gaps)", () => {
    // The regex joiner [^A-Za-z0-9]+ can span punctuation-only runs, including
    // structural markers like semicolons or brackets with no intervening words.
    // This documents expected behavior: quotes ARE pre-verified server-side before
    // reaching this function, so a match across "(a) (b)" or "; " is intentional.
    const sourceWithStructure = "means: (a) section 5; or (b) section 10 applies.";
    const quote = "5; or"; // words "5" and "or" separated by "; " (punctuation only)
    const span = findQuoteSpan(quote, sourceWithStructure);
    expect(span).not.toBeNull();
    expect(sourceWithStructure.slice(span!.start, span!.end)).toBe("5; or");
  });
});
