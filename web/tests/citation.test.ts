// tests/citation.test.ts
import { describe, it, expect } from "vitest";
import { legislationSearchUrl } from "../src/citation";

describe("legislationSearchUrl", () => {
  it("builds a path-DSL search URL with the Act title URL-encoded", () => {
    const url = legislationSearchUrl("Privacy Act 1988");
    expect(url).toBe(
      "https://www.legislation.gov.au/search/text(%22Privacy%20Act%201988%22,nameAndText,contains)/pointintime(Latest)"
    );
  });

  it("encodes special characters in the Act title, matching the site's own encodeURIComponent-style escaping", () => {
    const url = legislationSearchUrl("Superannuation Industry (Supervision) Act 1993");
    expect(url).toContain(encodeURIComponent("Superannuation Industry (Supervision) Act 1993"));
  });
});
