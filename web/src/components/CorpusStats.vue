<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Stats } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://127.0.0.1:8000";

const stats = ref<Stats | null>(null);
const loadFailed = ref(false);

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) {
      loadFailed.value = true;
      return;
    }
    stats.value = await res.json();
  } catch (e) {
    loadFailed.value = true;
    console.error("CorpusStats: failed to load /stats", e);
  }
});

function formatted(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString("en-AU") : String(n);
}
</script>

<template>
  <p v-if="!loadFailed" class="corpus-stats mono">
    <template v-if="stats">{{ formatted(stats.acts) }} Acts · {{ formatted(stats.defined_terms) }} defined terms · {{ formatted(stats.multi_act_terms) }} defined 3+ times</template>
    <template v-else>Calculating corpus size&hellip;</template>
  </p>
</template>

<style scoped>
.corpus-stats {
  font-size: 0.75rem;
  color: var(--color-ink-3);
  margin-top: var(--s-1);
}
</style>
