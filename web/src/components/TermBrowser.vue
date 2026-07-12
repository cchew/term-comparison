<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { MultiActTerm } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://127.0.0.1:8000";

const emit = defineEmits<{ (e: "select", term: string): void }>();

const terms = ref<MultiActTerm[]>([]);
const filterText = ref("");

const filteredTerms = computed(() => {
  const q = filterText.value.trim().toLowerCase();
  if (!q) return terms.value;
  return terms.value.filter((t) => t.display_term.toLowerCase().includes(q));
});

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/terms`);
    if (!res.ok) return;
    terms.value = await res.json();
  } catch (e) {
    // Enhancement, not core functionality — a failure here must not look like the
    // app itself is broken. Log and render nothing, consistent with how
    // difference_summary already degrades to null on LLM failure.
    console.error("TermBrowser: failed to load /terms", e);
  }
});
</script>

<template>
  <section class="term-browser">
    <input
      v-model="filterText"
      type="text"
      placeholder="Filter defined terms..."
      class="term-filter-input"
    />
    <div class="term-chips">
      <button
        v-for="t in filteredTerms"
        :key="t.term"
        type="button"
        class="term-chip"
        @click="emit('select', t.display_term)"
      >{{ t.display_term }} <span class="chip-count mono">{{ t.act_count }}</span></button>
    </div>
  </section>
</template>

<style scoped>
.term-browser {
  margin-bottom: var(--s-5);
}

.term-filter-input {
  width: 100%;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  padding: var(--s-2) var(--s-3);
  margin-bottom: var(--s-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
}

.term-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
  max-height: 220px;
  overflow-y: auto;
}

.term-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  font-family: var(--font-ui);
  font-size: 0.75rem;
  padding: var(--s-1) var(--s-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-ink-2);
  cursor: pointer;
  transition: all 0.12s var(--ease-spring);
}

.term-chip:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-ink-3);
}

.chip-count {
  font-size: 0.6875rem;
  color: var(--color-ink-3);
}
</style>
