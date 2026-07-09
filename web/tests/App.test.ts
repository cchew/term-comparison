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
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => RESPONSE,
    })));
  });

  it("renders the flagship term quick-select buttons", () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain("personal information");
    expect(wrapper.text()).toContain("australian resident");
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
});
