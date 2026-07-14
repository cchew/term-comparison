import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import App from "../src/App.vue";

const RESPONSE = {
  term: "personal information",
  definitions: [
    {
      display_term: "personal information",
      definition_text: "personal information means information about an identified individual.",
      act_title: "Privacy Act 1988",
      act_frbr_uri: "/akn/au/act/1988/119",
      section_eid: "sec-6",
    },
  ],
  difference_summary: null,
};

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/terms")) return { ok: true, status: 200, json: async () => [] };
      if (url.includes("/stats")) return { ok: true, status: 200, json: async () => ({ acts: 0, defined_terms: 0, multi_act_terms: 0 }) };
      return { ok: true, status: 200, json: async () => RESPONSE };
    }));
  });

  it("renders the flagship term quick-select buttons", () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain("personal information");
    expect(wrapper.text()).toContain("Australian resident");
    expect(wrapper.text()).toContain("constitutional corporation");
    expect(wrapper.text()).toContain("civil penalty provision");
  });

  it("searching a flagship term renders its definitions", async () => {
    const wrapper = mount(App);
    await wrapper.get(".flagship-btn").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Privacy Act 1988");
  });

  it("shows a not-found message on 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    const wrapper = mount(App);
    await wrapper.find(".search-input").setValue("not a real term");
    await wrapper.find(".search-row").trigger("submit.prevent");
    await flushPromises();
    expect(wrapper.text()).toContain("No Commonwealth Act defines");
  });

  it("shows the difference summary when present", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ...RESPONSE, difference_summary: "The Acts differ in scope." }),
    })));
    const wrapper = mount(App);
    await wrapper.get(".flagship-btn").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("The Acts differ in scope.");
  });

  it("renders the term browser and searching a browsed term reuses the same search flow", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/terms")) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ term: "income support payment", display_term: "income support payment", act_count: 3 }],
        };
      }
      return { ok: true, status: 200, json: async () => RESPONSE };
    }));
    const wrapper = mount(App);
    await flushPromises();
    expect(wrapper.text()).toContain("income support payment");

    await wrapper.get(".term-chip").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Privacy Act 1988");
  });

  it("passes the differences from the response through to DefinitionPanel", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/terms")) return { ok: true, status: 200, json: async () => [] };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ...RESPONSE,
          differences: [
            {
              act_title: "Privacy Act 1988",
              quote: "information about an identified individual",
              note: "narrower",
            },
          ],
        }),
      };
    }));
    const wrapper = mount(App);
    await wrapper.get(".flagship-btn").trigger("click");
    await flushPromises();
    expect(wrapper.findAll("mark")).toHaveLength(1);
  });

  it("hides the term browser by default", () => {
    const wrapper = mount(App, { attachTo: document.body });
    expect(wrapper.find("#term-browser-panel").isVisible()).toBe(false);
    expect(wrapper.find(".term-browser-toggle").attributes("aria-expanded")).toBe("false");
    wrapper.unmount();
  });

  it("lets the toggle button expand and hide the term browser", async () => {
    const wrapper = mount(App, { attachTo: document.body });

    await wrapper.get(".term-browser-toggle").trigger("click");
    expect(wrapper.find("#term-browser-panel").isVisible()).toBe(true);
    expect(wrapper.find(".term-browser-toggle").attributes("aria-expanded")).toBe("true");

    await wrapper.get(".term-browser-toggle").trigger("click");
    expect(wrapper.find("#term-browser-panel").isVisible()).toBe(false);
    wrapper.unmount();
  });

  it("does not change the term browser's expanded state when a search runs", async () => {
    const wrapper = mount(App, { attachTo: document.body });

    await wrapper.get(".term-browser-toggle").trigger("click");
    expect(wrapper.find("#term-browser-panel").isVisible()).toBe(true);

    await wrapper.get(".flagship-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find("#term-browser-panel").isVisible()).toBe(true);
    expect(wrapper.find(".term-browser-toggle").attributes("aria-expanded")).toBe("true");
    wrapper.unmount();
  });

  it("renders no difference-summary paragraph when the API sends a null summary", async () => {
    // Contract note: the real backend (see api.py's _fallback_summary) now always
    // sends a non-null string when 2+ definitions exist. This test only guards
    // against the frontend crashing/rendering stale filler text if that contract
    // is ever violated (e.g. deploy skew) — it is not a designed UX state.
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/terms")) return { ok: true, status: 200, json: async () => [] };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ...RESPONSE,
          definitions: [...RESPONSE.definitions, { ...RESPONSE.definitions[0], act_title: "Crimes Act 1914" }],
          difference_summary: null,
        }),
      };
    }));
    const wrapper = mount(App);
    await wrapper.get(".flagship-btn").trigger("click");
    await flushPromises();
    expect(wrapper.find(".difference-summary").exists()).toBe(false);
  });

  it("renders CorpusStats near the header", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/stats")) {
        return { ok: true, status: 200, json: async () => ({ acts: 24, defined_terms: 1893, multi_act_terms: 105 }) };
      }
      if (url.includes("/terms")) return { ok: true, status: 200, json: async () => [] };
      return { ok: true, status: 200, json: async () => RESPONSE };
    }));
    const wrapper = mount(App);
    await flushPromises();
    expect(wrapper.find(".corpus-stats").exists()).toBe(true);
  });

  it("shows the disclaimer footer on load, with no interaction required", () => {
    const wrapper = mount(App);
    expect(wrapper.find(".disclaimer").exists()).toBe(true);
    expect(wrapper.find(".disclaimer").text()).toContain("Not an official government service");
  });
});
