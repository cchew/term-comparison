// tests/CorpusStats.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CorpusStats from "../src/components/CorpusStats.vue";

describe("CorpusStats", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ acts: 24, defined_terms: 1893, multi_act_terms: 105 }),
    })));
  });

  it("fetches /stats on mount and renders the live counts", async () => {
    const wrapper = mount(CorpusStats);
    await flushPromises();
    const text = wrapper.text();
    expect(text).toContain("24");
    expect(text).toContain("1893");
    expect(text).toContain("105");
  });

  it("renders nothing when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network error"); }));
    const wrapper = mount(CorpusStats);
    await flushPromises();
    expect(wrapper.find(".corpus-stats").exists()).toBe(false);
  });
});
