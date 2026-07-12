<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Stats } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://127.0.0.1:8000";

const stats = ref<Stats | null>(null);

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) return;
    stats.value = await res.json();
  } catch (e) {
    console.error("CorpusStats: failed to load /stats", e);
  }
});
</script>

<template>
  <p v-if="stats" class="corpus-stats mono">
    {{ stats.acts }} Acts · {{ stats.defined_terms }} defined terms · {{ stats.multi_act_terms }} defined 3+ times
  </p>
</template>

<style scoped>
.corpus-stats {
  font-size: 0.75rem;
  color: var(--color-ink-3);
  margin-top: var(--s-1);
}
</style>
