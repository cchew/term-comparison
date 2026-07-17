// src/tour.ts
// First-visit guided walkthrough for the four things a new visitor needs to
// find: the search box, the sample-term shortcuts, the term browser, and what
// a result actually looks like. Shown once per browser (localStorage flag),
// relaunchable any time from the "Take the tour" header button.
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const TOUR_SEEN_KEY = "act-alike-tour-seen";

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return true; // storage unavailable (e.g. private browsing) — don't force the tour every load
  }
}

function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // storage unavailable — nothing to persist, tour just replays next visit
  }
}

// driver.js unconditionally stamps aria-haspopup="dialog"/aria-expanded="true"/
// aria-controls on whatever element it highlights, regardless of that element's
// role — invalid per WAI-ARIA on a textbox, nav, or generic div (only widget
// roles like button/combobox support aria-expanded), and axe correctly flags it
// as a critical violation. The popover itself already has proper dialog
// semantics (aria-describedby/aria-labelledby), so these three attributes on
// the target add nothing real; strip them once driver.js finishes highlighting.
function stripInvalidAria(element?: Element): void {
  element?.removeAttribute("aria-haspopup");
  element?.removeAttribute("aria-expanded");
  element?.removeAttribute("aria-controls");
}

export function startTour(): ReturnType<typeof driver> {
  const tour = driver({
    showProgress: true,
    allowClose: true,
    onHighlighted: stripInvalidAria,
    steps: [
      {
        element: "#term-search",
        popover: {
          title: "Search for a legal term",
          description: "Type any term to compare how it's defined across Commonwealth Acts.",
        },
      },
      {
        element: ".flagship-nav",
        popover: {
          title: "Or try a sample term",
          description: "These flagship terms are known to have interesting differences across Acts.",
        },
      },
      {
        element: ".term-browser-toggle",
        popover: {
          title: "Browse every defined term",
          description: "See every term defined in 3+ Acts and jump straight to a comparison.",
        },
      },
      {
        element: ".results-block",
        popover: {
          title: "Your results",
          description: "An AI-generated summary of key differences appears first, then one panel per Act with its own definition text and a citation link back to legislation.gov.au.",
        },
      },
      {
        element: ".help-btn",
        popover: {
          title: "How this works",
          description: "Click here any time for details on accuracy checks and known corpus coverage gaps.",
        },
      },
    ],
  });
  tour.drive();

  // Deliberately not using driver.js's onDestroyed/onCloseClick hooks: empirically
  // (driver.js 1.7.0) onDestroyed only fires from the final "Done" button, and
  // Escape closes the popover without triggering either hook at all — so a
  // visitor who dismisses the tour the normal way (X, Escape, overlay click)
  // would otherwise see it again on every future visit. Watching the popover's
  // own removal from the DOM is dismissal-method-agnostic and catches all of them.
  const popoverWatcher = new MutationObserver(() => {
    if (!document.querySelector(".driver-popover")) {
      markTourSeen();
      popoverWatcher.disconnect();
    }
  });
  popoverWatcher.observe(document.body, { childList: true, subtree: true });

  return tour;
}
