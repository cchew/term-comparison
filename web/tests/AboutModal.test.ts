import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AboutModal from "../src/components/AboutModal.vue";

describe("AboutModal", () => {
  it("renders nothing when closed", () => {
    const wrapper = mount(AboutModal, { props: { open: false } });
    expect(wrapper.find('[data-testid="about-modal"]').exists()).toBe(false);
  });

  it("renders all five sections when open", () => {
    const wrapper = mount(AboutModal, { props: { open: true } });
    const text = wrapper.text();
    expect(text).toContain("What this does");
    expect(text).toContain("How it's built");
    expect(text).toContain("How we check accuracy");
    expect(text).toContain("Known limitations");
    expect(text).toContain("Scope");
    expect(text).toContain("Not an official government service");
  });

  it("emits close when the close button is clicked", async () => {
    const wrapper = mount(AboutModal, { props: { open: true } });
    await wrapper.find('[data-testid="about-close"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when the backdrop is clicked", async () => {
    const wrapper = mount(AboutModal, { props: { open: true } });
    await wrapper.find(".modal-backdrop").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when Escape is pressed", async () => {
    const wrapper = mount(AboutModal, { props: { open: true } });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
