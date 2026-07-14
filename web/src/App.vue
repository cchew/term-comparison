<script setup lang="ts">
import { ref } from "vue";
import type { ComparisonResponse } from "./types";
import DefinitionPanel from "./components/DefinitionPanel.vue";
import TermBrowser from "./components/TermBrowser.vue";
import CorpusStats from "./components/CorpusStats.vue";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://127.0.0.1:8000";
const FLAGSHIP_TERMS = ["personal information", "Australian resident", "constitutional corporation", "civil penalty provision"];

const term = ref("");
const result = ref<ComparisonResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const browserExpanded = ref(false);

async function search(t: string) {
  if (!t.trim()) return;
  term.value = t;
  loading.value = true;
  error.value = null;
  result.value = null;
  try {
    const res = await fetch(`${API_BASE}/definitions?term=${encodeURIComponent(t)}`);
    if (res.status === 404) {
      error.value = `No Commonwealth Act defines "${t}".`;
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    result.value = await res.json();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Search failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-title">
        <h1>Act Alike (IM2026)</h1>
        <p class="subtitle">Term comparison across Commonwealth Acts: does this legal term mean the same thing everywhere it's used?</p>
      </div>
      <CorpusStats />
    </header>
    <div class="main-layout">
      <div class="content-col">
        <main class="search-block">
          <p class="search-instructions">Type a legal term, pick a shortcut below, or browse all defined terms in the panel.</p>
          <form class="search-row" @submit.prevent="search(term)">
            <label for="term-search" class="visually-hidden">Search for a legal term</label>
            <input id="term-search" v-model="term" type="text" placeholder="e.g. personal information" class="search-input" />
            <button type="submit" class="search-btn">Compare</button>
          </form>
          <nav class="flagship-nav" aria-label="Flagship term shortcuts">
            <button
              v-for="t in FLAGSHIP_TERMS"
              :key="t"
              type="button"
              class="flagship-btn"
              @click="search(t)"
            >{{ t }}</button>
          </nav>
        </main>

        <div class="results-block">
          <p v-if="loading" class="loading">Searching...</p>
          <p v-else-if="error" class="load-error">{{ error }}</p>

          <template v-else-if="result">
            <p v-if="result.difference_summary" class="difference-summary">{{ result.difference_summary }}</p>
            <DefinitionPanel :definitions="result.definitions" :differences="result.differences" />
          </template>
        </div>
      </div>

      <aside class="browser-aside" aria-label="Browse defined terms">
        <button
          type="button"
          class="term-browser-toggle"
          :aria-expanded="browserExpanded"
          aria-controls="term-browser-panel"
          @click="browserExpanded = !browserExpanded"
        >{{ browserExpanded ? 'Hide' : 'Browse' }} defined terms</button>
        <div id="term-browser-panel" class="term-browser-panel" v-show="browserExpanded">
          <TermBrowser @select="search" />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  margin: 0 auto;
  padding: var(--s-6) var(--s-5);
}

.main-layout {
  display: grid;
  grid-template-areas: "search" "browser" "results";
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-5);
}

.content-col { display: contents; }
.search-block { grid-area: search; }
.results-block { grid-area: results; }

.app-header {
  margin-bottom: var(--s-5);
  padding-bottom: var(--s-4);
  border-bottom: 1px solid var(--color-border);
}

.app-header h1 { font-size: 1.125rem; color: var(--color-ink); }
.subtitle { font-size: 0.75rem; color: var(--color-ink-3); margin-top: 0.2rem; }

.search-instructions {
  font-size: 0.8125rem;
  color: var(--color-ink-3);
  margin-bottom: var(--s-2);
}

.search-row {
  display: flex;
  gap: var(--s-2);
  margin-bottom: var(--s-3);
}

.search-input {
  flex: 1;
  font-family: var(--font-ui);
  font-size: 0.875rem;
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
}

.search-btn, .flagship-btn {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 500;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-ink-2);
  cursor: pointer;
  transition: all 0.12s var(--ease-spring);
}

.search-btn { background: var(--color-ink); border-color: var(--color-ink); color: var(--color-bg); }
.search-btn:hover { opacity: 0.9; }
.flagship-btn:hover { background: var(--color-surface-hover); border-color: var(--color-ink-3); }

.search-btn:focus-visible, .flagship-btn:focus-visible {
  outline: 2px solid var(--color-accent-border);
  outline-offset: 2px;
}

.search-input:focus-visible {
  outline: 2px solid var(--color-accent-border);
  outline-offset: 2px;
}

.flagship-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
}

.browser-aside {
  grid-area: browser;
  position: sticky;
  top: var(--s-5);
}

@media (min-width: 860px) {
  .main-layout {
    grid-template-areas: "content aside";
    grid-template-columns: minmax(0, var(--reading-width)) minmax(260px, 1fr);
    column-gap: var(--s-6);
  }

  .content-col {
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
    grid-area: content;
  }

  .browser-aside { grid-area: aside; }
}

.term-browser-toggle {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-ink-2);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.term-browser-toggle:hover { color: var(--color-ink); }

.term-browser-toggle:focus-visible {
  outline: 2px solid var(--color-accent-border);
  outline-offset: 2px;
}

.term-browser-panel {
  margin-top: var(--s-3);
  padding: var(--s-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
}

.difference-summary {
  padding: var(--s-3) var(--s-4);
  margin-bottom: var(--s-4);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-ink);
}

.load-error { color: var(--color-ink-2); font-size: 0.875rem; }
.loading { color: var(--color-ink-3); font-size: 0.875rem; }
</style>
