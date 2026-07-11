// tests/DefinitionPanel.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DefinitionPanel from "../src/components/DefinitionPanel.vue";
import type { DefinitionOut, DifferenceOut } from "../src/types";

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

  it("renders no <mark> elements when no differences are passed", () => {
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS } });
    expect(wrapper.findAll("mark")).toHaveLength(0);
  });

  it("wraps a verified quote in <mark> for the matching card", () => {
    const differences: DifferenceOut[] = [
      {
        act_title: "Privacy Act 1988",
        quote: "information about an identified individual",
        note: "narrower — excludes opinions",
      },
    ];
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS, differences } });
    const marks = wrapper.findAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].text()).toBe("information about an identified individual");
  });

  it("leaves text unmarked when the quote does not match any card", () => {
    const differences: DifferenceOut[] = [
      { act_title: "Privacy Act 1988", quote: "this exact phrase does not appear anywhere", note: "fabricated" },
    ];
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS, differences } });
    expect(wrapper.findAll("mark")).toHaveLength(0);
  });

  it("only marks the card matching the difference's act_title", () => {
    const differences: DifferenceOut[] = [
      {
        act_title: "Privacy Act 1988",
        quote: "information about an identified individual",
        note: "narrower",
      },
    ];
    const wrapper = mount(DefinitionPanel, { props: { definitions: DEFS, differences } });
    const cards = wrapper.findAll(".definition-card");
    expect(cards[0].findAll("mark")).toHaveLength(1);
    expect(cards[1].findAll("mark")).toHaveLength(0);
  });
});
