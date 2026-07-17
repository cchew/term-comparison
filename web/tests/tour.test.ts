import { describe, it, expect, vi, beforeEach } from "vitest";

// driver.js schedules its own close/destroy via requestAnimationFrame, which
// happy-dom doesn't reliably drive on its own — mock it so we test OUR wiring
// (which step targets what, and that destroying the tour marks it seen)
// rather than fighting the third-party library's animation timing.
const driveMock = vi.fn();
const destroyMock = vi.fn();
let lastConfig: any;
vi.mock("driver.js", () => ({
  driver: vi.fn((config: any) => {
    lastConfig = config;
    return { drive: driveMock, destroy: destroyMock };
  }),
}));

import { startTour, hasSeenTour, TOUR_SEEN_KEY } from "../src/tour";

describe("tour", () => {
  beforeEach(() => {
    localStorage.clear();
    driveMock.mockClear();
    destroyMock.mockClear();
  });

  it("hasSeenTour is false until the flag is set", () => {
    expect(hasSeenTour()).toBe(false);
    localStorage.setItem(TOUR_SEEN_KEY, "1");
    expect(hasSeenTour()).toBe(true);
  });

  it("starts and drives the tour", () => {
    startTour();
    expect(driveMock).toHaveBeenCalled();
  });

  it("targets the five key first-visit elements in order", () => {
    startTour();
    const targets = lastConfig.steps.map((s: any) => s.element);
    expect(targets).toEqual([
      "#term-search",
      ".flagship-nav",
      ".term-browser-toggle",
      ".results-block",
      ".help-btn",
    ]);
  });

  // "Marks seen once dismissed" is covered against the *real* driver.js in
  // tour-dismissal.test.ts — driver.js's onDestroyed/onCloseClick hooks proved
  // unreliable (onDestroyed only fires from the final "Done" button, and
  // Escape doesn't trigger either), so startTour() instead watches the
  // popover's removal from the DOM directly. That behavior is meaningless to
  // assert against this file's mocked driver() stub.
});
