---
name: ai-clustering
description: Cluster/categorize a large dataset using AI with a two-round map-reduce approach: batch items to generate candidate category labels, reduce to a unified set, then categorize every item. Use when you need to discover and apply categories to a large corpus of text, prompts, products, tickets, or any unstructured data.
---

# AI Clustering (Map-Reduce Pattern)

Two rounds. Categories emerge from the data — never hardcode them upfront.

## Round 1 — Map + Reduce

**Map:** Feed batches of items into concurrent AI calls. Each call outputs candidate category labels describing patterns it sees.

**Reduce:** One AI call merges all candidate labels into a clean, deduplicated unified set.

## Round 2 — Categorize

Feed all items through batched concurrent AI calls using the unified category set. Each item gets assigned one (or N) category labels.

---

## Implementation Pattern

```typescript
// Round 1 Map — per batch
async function r1Batch(items: Item[], idx: number): Promise<string[]> {
  const block = items.map(item => `- ${snippet(item)}`).join('\n')
  const { output } = await generateText({
    model: gateway('google/gemini-2.5-flash-lite'),
    output: Output.object({ schema: z.object({ categories: z.array(z.string()) }) }),
    temperature: 0.3,
    prompt: `[CONTEXT: explain what these items ARE and what dimension to cluster on]
Study these ${items.length} items. Generate category labels describing [HOW/WHAT/WHICH dimension].
Items: ${block}
Return 5–12 labels in lowercase-kebab-case.`,
  })
  if (!output) throw new Error('AI failed to generate categories')
  return output.categories
}

// Round 1 Reduce
async function reduce(allCandidates: string[][]): Promise<Category[]> {
  const unique = [...new Set(allCandidates.flat())]
  const { output } = await generateText({
    model: gateway('google/gemini-2.5-flash-lite'),
    output: Output.object({ schema: z.object({ categories: z.array(z.object({ label: z.string(), description: z.string() })) }) }),
    temperature: 0.1,
    prompt: `Merge these raw labels into a clean unified set. Merge synonyms.
Labels: ${unique.join(', ')}
Target 8–15 final categories with a one-sentence description each.`,
  })
  if (!output) throw new Error('AI failed to reduce categories')
  return output.categories
}

// Round 2 Categorize — per batch
async function r2Batch(items: Item[], categories: Category[], idx: number): Promise<Map<string, string>> {
  const catList = categories.map(c => `- ${c.label}: ${c.description}`).join('\n')
  const block = items.map(i => `${i.id}|||${snippet(i)}`).join('\n')
  const { output } = await generateText({
    model: gateway('google/gemini-2.5-flash-lite'),
    output: Output.object({ schema: z.object({ results: z.array(z.object({ id: z.string(), category: z.string() })) }) }),
    temperature: 0,
    prompt: `CATEGORIES:\n${catList}\n\nAssign each item to exactly ONE category.\n${block}`,
  })
  if (!output) throw new Error('AI failed to categorize items')
  const map = new Map<string, string>()
  for (const r of output.results) map.set(r.id, r.category)
  return map
}
```

---

## Critical Rules

### Context is everything
Tell the AI **what the items are** and **which dimension to cluster on**. Without this, it defaults to the most obvious semantic grouping (which is usually wrong).

```
❌ "Classify these prompts"
✅ "These are ALL initial project creation prompts typed into an AI app-builder.
    Every one is trying to build an app — that's a given.
    Cluster by HOW the user wrote it (format, structure, communication style), not WHAT they want to build."
```

### Snippet + metadata — never raw truncation
When truncating long text, append length metadata so the model can factor in the full scope:

```typescript
function snippet(item: Item, maxChars = 200): string {
  const clean = item.text.replace(/\r?\n/g, ' ').trim()
  const words = clean.split(/\s+/).length
  const snip  = clean.slice(0, maxChars)
  return clean.length > maxChars
    ? `${snip} [TRUNCATED — full: ${words}w ${clean.length}ch]`
    : snip
}
```

### Throttled concurrency + timeout + resume
```typescript
const CONCURRENCY = 12
const TIMEOUT_MS  = 90_000

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), ms))])
}

// Save progress after every batch — reruns pick up where they left off
assignments = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf-8')) : {}
const pending = batches.filter(b => b.some(item => !assignments[item.id]))
```

### Batch sizing guidelines
| Dataset size | Batch size | # batches |
|---|---|---|
| ~100 items | 30 | ~4 |
| ~1000 items | 80–100 | ~12 |
| ~10000 items | 100 | ~100 |

Use `gemini-2.5-flash-lite` for both rounds — fast, cheap, good at classification.

---

## What emerges vs what to hardcode

**Let emerge from data (Round 1):** The actual category labels and their meanings.

**Hardcode only:** The clustering *dimension* — i.e. the question you're asking the data.

Examples of good dimensions:
- "HOW the prompt is written (format/style)" — not "what app they want"
- "Industry vertical" — not "company size"
- "Root cause" — not "which team owns it"

---

## Sampling after clustering

Pick representative items from each cluster spanning the full length distribution:

```typescript
function pickSamples(items: Item[], n: number): Item[] {
  const sorted = [...items].sort((a, b) => a.text.length - b.text.length)
  const third  = Math.floor(sorted.length / 3)
  const pick   = (g: Item[], k: number) => {
    const med = g[Math.floor(g.length / 2)]?.text.length ?? 0
    return [...g].sort((a, b) => Math.abs(a.text.length - med) - Math.abs(b.text.length - med)).slice(0, k)
  }
  const perT = Math.ceil(n / 3)
  return [
    ...pick(sorted.slice(0, third), perT),
    ...pick(sorted.slice(third, third * 2), perT),
    ...pick(sorted.slice(third * 2), n - perT * 2),
  ].slice(0, n)
}
```

This gives you short + medium + long representatives from each cluster — not just the average.
