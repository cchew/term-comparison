<script setup lang="ts">
import type { DefinitionOut } from "../types";
defineProps<{ definitions: DefinitionOut[] }>();
</script>

<template>
  <div class="definition-panel">
    <article v-for="d in definitions" :key="d.act_frbr_uri + d.section_eid" class="definition-card">
      <div class="source-chip mono">{{ d.act_title }} · {{ d.section_eid }}</div>
      <p class="definition-text">{{ d.definition_text }}</p>
    </article>
  </div>
</template>

<style scoped>
.definition-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--s-4);
}

.definition-card {
  padding: var(--s-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.source-chip {
  display: inline-block;
  padding: var(--s-1) var(--s-2);
  background: var(--chip-source-bg);
  color: var(--chip-source-text);
  border: 1px solid var(--chip-source-border);
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  margin-bottom: var(--s-2);
}

.definition-text {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-ink);
}
</style>
