// tests/crossref.test.ts
import { describe, it, expect } from "vitest";
import { detectCrossReference } from "../src/crossref";

describe("detectCrossReference", () => {
  it("detects a simple cross-reference to another Act", () => {
    expect(detectCrossReference("in the Privacy Act 1988.", "Corporations Act 2001")).toBe(
      "Privacy Act 1988"
    );
  });

  it("detects a cross-reference with leading filler words", () => {
    expect(detectCrossReference("it has in the Privacy Act 1988.", "Criminal Code Act 1995")).toBe(
      "Privacy Act 1988"
    );
  });

  it("detects a cross-reference that also cites a section, including a non-breaking space before the year", () => {
    // Real corpus text may contain a non-breaking space (U+00A0) between "Act" and "1988".
    const text = "section 6 of the Privacy Act 1988.";
    expect(detectCrossReference(text, "Crimes Act 1914")).toBe("Privacy Act 1988");
  });

  it("detects a cross-reference to a different Act than the term's home Act", () => {
    expect(
      detectCrossReference("in the Private Health Insurance Act 2007.", "Ombudsman Act 1976")
    ).toBe("Private Health Insurance Act 2007");
  });

  it("detects a cross-reference with complex schedule/section phrasing", () => {
    expect(
      detectCrossReference(
        "section 388-50 in Schedule 1 to the Taxation Administration Act 1953.",
        "Some Other Act 2000"
      )
    ).toBe("Taxation Administration Act 1953");
  });

  it("detects a cross-reference to an Act name with a parenthetical", () => {
    const text = "the meaning given by the A New Tax System (Family Assistance) Act 1999.";
    expect(detectCrossReference(text, "Social Security Act 1991")).toBe(
      "A New Tax System (Family Assistance) Act 1999"
    );
  });

  it("returns null for a same-Act self-reference with no Act name in the text", () => {
    expect(detectCrossReference("a form approved under section 4A.", "Customs Act 1901")).toBeNull();
  });

  it("returns null for a same-Act self-reference citing only a section number", () => {
    expect(
      detectCrossReference("section 32.", "Industry Research and Development Act 1986")
    ).toBeNull();
  });

  it("returns null for a genuine terse definition naming no other Act", () => {
    expect(detectCrossReference("a form approved, in writing, by APRA.", "Banking Act 1959")).toBeNull();
  });

  it("returns null for a genuine substantive definition", () => {
    const text =
      "information or an opinion about an identified individual, or an individual who is reasonably identifiable:";
    expect(detectCrossReference(text, "Privacy Act 1988")).toBeNull();
  });
});
