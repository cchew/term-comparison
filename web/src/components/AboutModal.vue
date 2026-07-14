<script setup lang="ts">
defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div v-if="open" data-testid="about-modal" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true" aria-label="How Act Alike works">
      <button data-testid="about-close" class="modal-close" @click="$emit('close')" aria-label="Close">✕</button>

      <section class="modal-section">
        <h2>What this does</h2>
        <p>Act Alike compares how the same legal term is defined across different Commonwealth Acts of Parliament, with citations back to the source text.</p>
      </section>

      <section class="modal-section">
        <h2>How it's built</h2>
        <p class="pipeline mono">legislation.gov.au DOCX &rarr; AKN 3.0 XML (lex-au) &rarr; definition graph (lex-au-graph) &rarr; FastAPI + Claude difference-summary (this repo) &rarr; what you're looking at now</p>
      </section>

      <section class="modal-section">
        <h2>How we check accuracy</h2>
        <p>Every claimed difference between Acts is checked against the actual source Act text before it's shown — if a claim can't be matched back to real text, it's dropped, not displayed. When nothing verifies, you'll still see a plain factual headline (e.g. how many distinct definition texts were found) rather than nothing at all.</p>
      </section>

      <section class="modal-section">
        <h2>Known limitations</h2>
        <ul>
          <li><strong>Corpus coverage.</strong> Some Acts' definitions haven't been extracted yet by the underlying legislation pipeline. A "no results" response means the term isn't tagged in the corpus yet — not that it's undefined in Australian law.</li>
          <li><strong>Paragraph-list definitions.</strong> Some definitions written as a list ("(a)... (b)... (c)...") currently extract only the lead-in phrase, not the full list content.</li>
        </ul>
      </section>

      <section class="modal-section">
        <h2>Scope</h2>
        <p class="scope-declaration" data-testid="scope-declaration">Not an official government service. Does not provide legal advice or compliance conclusions.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--s-5);
}

.modal-panel {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-width: 640px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: var(--s-6) var(--s-5);
}

.modal-close {
  position: absolute;
  top: var(--s-4);
  right: var(--s-4);
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--color-ink-3);
  cursor: pointer;
}

.modal-section { margin-bottom: var(--s-5); }
.modal-section h2 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: var(--s-2);
  color: var(--color-ink);
}
.modal-section p, .modal-section li {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-ink-2);
}
.modal-section ul { padding-left: var(--s-4); }
.modal-section li { margin-bottom: var(--s-2); }

.pipeline { word-break: break-word; }

.scope-declaration {
  font-size: 0.75rem;
  color: var(--color-ink);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--s-3);
}
</style>
