---
name: voice
description: Writing voice calibration for SEO articles. Read this BEFORE SOP.md. These rules determine whether an article is enjoyable to read. Technical structure, MDX, and SEO rules are in SOP.md.
---

# Writing Voice

Read this immediately after the brief — before SOP.md. These 10 rules determine article quality. Agents absorb the most recently read content most strongly, so these must be fresh when writing starts.

**Reference articles this voice is calibrated on:**
- PostHog "testing AI agents" — narrative arc, precise technical depth
- PostHog "standup bot revenge" — personal stakes, "I'll be honest" credibility moves
- PostHog "best error tracking tools" — honest competitor praise, "best for" summaries
- Plausible "backlinks SEO guide" — definition-first, meta-demonstration while explaining
- Plausible "European privacy tools" — curated list, personal disclosure, consistent format

---

## Rule 1 — Open cold. No warmup.

First sentence carries full weight. Drop into the substance immediately.

```
✓ "There it is. Staring at me. Goading me."              (drops into the moment)
✓ "Software testing used to be straightforward. AI agents changed this."  (contrast)
✓ "Backlinks are when another website links back to you."  (bare definition, zero preamble)

✗ "In the rapidly evolving world of AI..."
✗ "Whether you're a developer or non-technical founder..."
✗ "Have you ever wondered why...?"
```

## Rule 2 — Short sentences land the point.

Rhythm: explain (15–25 words) → land (4–8 words) → next idea.

```
✓ "It was a mess."                        (4 words after explaining a failed architecture)
✓ "AI agents changed this."               (4 words after describing deterministic testing)
✓ "It's not that simple."                 (5 words after reader thinks they understand)

✗ "The multi-agent architecture, while initially seeming promising, proved excessively complex
   for the task, leading to debugging challenges and maintenance overhead."
   → "It was a mess. Debugging handoffs was painful. The coordinator called the wrong agent."
```

## Rule 2.5 — 1–2 sentence paragraphs (74% of reference articles)

Max 3 sentences. Four or more in one paragraph is almost never correct.
New idea = new paragraph. One-sentence paragraphs carry the most force.

```
✗ A paragraph that explains + gives an example + draws a conclusion + transitions.
   That's four paragraphs.
```

Every 3–4 paragraphs of prose: insert a structural break — subheader, list, code block, or callout.

## Rule 3 — Show the real thing.

When something does something, show the actual output. Not a description.

```
✓ Real terminal output, real timestamps, real PR numbers, real GitHub stars
✓ "Some highlights: 'bad bad bad!!!!!' / 'ok this is terrible, I'm exiting to debug'"
✗ "The agent processes your GitHub activity and generates a comprehensive summary."
```

## Rule 4 — Honest tradeoffs build more trust than polish.

Every article admits something: costs too much, breaks for large teams, failed the first time.

```
✓ "Did I save time? Debatable. Might there be AI slop? Most definitely."
✓ "I ripped it all out — 300 fewer lines. Something that actually worked reliably."
✗ "OpenClaw provides powerful automation capabilities across a wide range of use cases."
```

Be specific: "works for teams up to 15 people — larger teams hit rate limits when running 5 skills concurrently at 9 AM."

## Rule 5 — Headers tell you what the section IS, not just its topic.

```
✓ Narrative:  "The birth of the agent" · "Stealing my own GitHub activity"
✓ Insight:    "Testing agents isn't one size fits all"
✓ Inversion:  "How NOT to get backlinks?"
✓ Playful:    "The architecture: one agent to rule them all"

✗ "Benefits"        → ✓ "Why three agents was worse than one"
✗ "Overview"        → ✓ "The architecture: one agent to rule them all"
✗ "Implementation"  → ✓ "Stealing my own GitHub activity"
✗ "Conclusion"      → hard rule: NEVER use this heading
```

## Rule 6 — End on a specific next action.

Not "explore" or "consider reaching out." The actual command, the exact thing.

```
✓ "Start with tracing. One dataset. One evaluator. Run it in CI. That is enough for week one."
✓ "The standup bot still messages me at 6 PM. I just run `standup generate` and let it talk."
✗ "We hope this guide has been helpful. Consider reaching out to learn more about how..."
```

## Rule 7 — Narrative arc beats random ordering (tutorials).

Structure the article as the life story of the problem. Each section ends naming a gap; the next opens solving it.

```
Gap → Solution → New gap → Solution → Cycle completes
```

Not "Step 1, Step 2, Step 3." Always: "What happens when the reader does the thing, and what breaks next."

## Rule 8 — Personal stakes (only when genuine).

First-person irony or frustration only when it's real and specific.

```
✓ "I work on LLM analytics. I help people understand AI agents. And here I am,
   manually summarizing GitHub activity like a caveman."
✓ "P.S. We use Whereby at Plausible for internal video calls."  (only when true)
✗ "As someone passionate about AI, I believe the future of work involves leveraging..."
```

## Rule 9 — Comparison articles: lead with honest praise.

Every competitor gets a specific, genuine positive before your product wins.

```
✓ "Sentry is mature, battle-tested, and built for teams who value visibility over novelty."
✗ "While Sentry offers basic tracking, it lacks the comprehensive analytics modern teams need."
```

## Rule 10 — Never write these.

| Category | Banned |
|---|---|
| Buzzwords | leverage, utilize, synergy, game-changer, paradigm, seamlessly, holistic, robust |
| Hedges | may, might consider, could potentially, it's worth noting, arguably |
| Voice | Passive: "is tracked by the system" → "the system tracks" |
| Openers | Rhetorical questions: "Have you ever wondered...?" |
| Endings | `## Conclusion` — end on the FAQ or a specific next action |

---

## Blueprint Cheat Sheet

**A — Tutorial / Narrative Arc** (PostHog testing agents)
Each section ends naming a gap. Next section opens solving it. Close with a concrete starting checklist, not a summary.

**B — Personal Narrative + Tutorial** (PostHog standup bot)
Personal stakes → failed first attempt ("I'll be honest — I didn't start here") → what actually worked → real output → honest admission. Close with the actual command.

**C — Comparison / Tool Roundup** (PostHog error tracking)
Selection criteria → each tool leads with genuine strengths → "best for" summary per tool. Close with a decision guide ("Want X? Use A. Need Y? Use B.").

**D — Comprehensive Educational** (Plausible backlinks)
Bare definition → why it matters → good vs bad → how to do it → how NOT to do it. The inversion section ("How NOT to") is the most credible part. Close with what to do today.

**E — Curated List** (Plausible European tools)
Explicit selection criteria up front → consistent entry format → personal use disclosures ("P.S. We use this at [Company]") only when true. Close briefly, not with a summary.
