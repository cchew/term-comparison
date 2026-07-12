// tests/TermBrowser.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import TermBrowser from "../src/components/TermBrowser.vue";

const TERMS = [
  { term: "personal information", display_term: "personal information", act_count: 10 },
  { term: "australian resident", display_term: "Australian resident", act_count: 4 },
  { term: "small business", display_term: "small business", act_count: 3 },
];

describe("TermBrowser", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => TERMS,
    })));
  });

  it("fetches /terms on mount and renders a chip per term", async () => {
    const wrapper = mount(TermBrowser);
    await flushPromises();
    expect(wrapper.findAll(".term-chip")).toHaveLength(3);
    expect(wrapper.text()).toContain("personal information");
    expect(wrapper.text()).toContain("Australian resident");
  });

  it("filters the chip list client-side by substring, case-insensitively", async () => {
    const wrapper = mount(TermBrowser);
    await flushPromises();
    await wrapper.find(".term-filter-input").setValue("SMALL");
    expect(wrapper.findAll(".term-chip")).toHaveLength(1);
    expect(wrapper.text()).toContain("small business");
  });

  it("does not issue a new fetch call when the filter text changes", async () => {
    const wrapper = mount(TermBrowser);
    await flushPromises();
    const fetchSpy = vi.mocked(fetch);
    const callsBeforeFilter = fetchSpy.mock.calls.length;
    await wrapper.find(".term-filter-input").setValue("small");
    expect(fetchSpy.mock.calls.length).toBe(callsBeforeFilter);
  });

  it("emits select with the display_term when a chip is clicked", async () => {
    const wrapper = mount(TermBrowser);
    await flushPromises();
    await wrapper.findAll(".term-chip")[0].trigger("click");
    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual(["personal information"]);
  });

  it("renders no chips and does not throw when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network error"); }));
    const wrapper = mount(TermBrowser);
    await flushPromises();
    expect(wrapper.findAll(".term-chip")).toHaveLength(0);
  });
});
