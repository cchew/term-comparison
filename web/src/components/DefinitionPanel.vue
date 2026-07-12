<script setup lang="ts">
import type { DefinitionOut, DifferenceOut } from "../types";
import { findQuoteSpan } from "../highlight";
import { legislationSearchUrl } from "../citation";

const props = withDefaults(
  defineProps<{ definitions: DefinitionOut[]; differences?: DifferenceOut[] }>(),
  { differences: () => [] }
);

interface Segment {
  text: string;
  marked: boolean;
}

function segmentsFor(d: DefinitionOut): Segment[] {
  const match = props.differences.find((diff) => diff.act_title === d.act_title);
  if (!match) return [{ text: d.definition_text, marked: false }];

  const span = findQuoteSpan(match.quote, d.definition_text);
  if (!span) return [{ text: d.definition_text, marked: false }];

  const segments: Segment[] = [];
  if (span.start > 0) segments.push({ text: d.definition_text.slice(0, span.start), marked: false });
  segments.push({ text: d.definition_text.slice(span.start, span.end), marked: true });
  if (span.end < d.definition_text.length) {
    segments.push({ text: d.definition_text.slice(span.end), marked: false });
  }
  return segments;
}
</script>

<template>
  <div class="definition-panel">
    <article v-for="d in definitions" :key="d.act_frbr_uri + d.section_eid" class="definition-card">
      <div class="source-chip mono">{{ d.act_title }} · {{ d.section_eid }}</div>
      <a
        class="citation-link"
        :href="legislationSearchUrl(d.act_title)"
        target="_blank"
        rel="noopener noreferrer"
      >View on legislation.gov.au</a>
      <p class="definition-text">
        <span v-for="(seg, i) in segmentsFor(d)" :key="i" style="display: contents">
          <mark v-if="seg.marked">{{ seg.text }}</mark>
          <template v-else>{{ seg.text }}</template>
        </span>
      </p>
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

.citation-link {
  display: inline-block;
  font-size: 0.6875rem;
  color: var(--color-ink-3);
  margin-bottom: var(--s-2);
  text-decoration: underline;
}

.definition-text {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-ink);
}

.definition-text mark {
  background: var(--color-accent-bg);
  border: 1px solid var(--color-accent-border);
  border-radius: 3px;
  padding: 0 2px;
  color: inherit;
}
</style>
