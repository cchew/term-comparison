// tests/DefinitionPanel.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DefinitionPanel from "../src/components/DefinitionPanel.vue";
import type { DefinitionOut } from "../src/types";

const DEFS: DefinitionOut[] = [
  {
    display_term: "personal information",
    definition_text: "personal information means information about an identified individual.",
    act_title: "Privacy Act 1988",
    act_frbr_uri: "/akn/au/act/1988/119",
    section_eid: "sec-6",
  },
  {
    display_term: "personal information",
    definition_text: "personal information means information or an opinion about an identified individual.",
    act_title: "My Health Records Act 2012",
    act_frbr_uri: "/akn/au/act/2012/63",
    section_eid: "sec-5",
  },
];

describe("DefinitionPanel", () => {
  it("renders one card per definition", () => {
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS } });
    expect(wrapper.findAll(".definition-card")).toHaveLength(2);
  });

  it("shows the Act title and section citation in the chip", () => {
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS } });
    expect(wrapper.text()).toContain("Privacy Act 1988");
    expect(wrapper.text()).toContain("sec-6");
  });

  it("shows the definition text", () => {
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS } });
    expect(wrapper.text()).toContain("information about an identified individual");
  });
});
