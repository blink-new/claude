# Blink — Copy & Brand Language Configuration

## Exact CTA Strings by Market

Use these verbatim. Do not paraphrase.

### Market A (OpenClaw / Blink Claw)
**Full CTA:**
```
Run OpenClaw without the hassle — Blink Claw handles everything from $22/mo → blink.new/claw
```
**Short form (for inline body references):**
```
Blink Claw from $22/mo → blink.new/claw
```

### Market B (AI App Builder / Vibe Coding)
**Full CTA:**
```
Build this with Blink — database, auth, and hosting included. No config needed → blink.new
```
**Short form:**
```
Build this with Blink — everything included → blink.new
```

### Market C (Claude Code / Agentic Coding)
**Full CTA:**
```
Building with Claude Code? Deploy on Blink — database, auth, and hosting included → blink.new
```
**Short form:**
```
Deploy on Blink — everything included → blink.new
```

---

## CTA Hard Rules

- **DO NOT write manual CTA sections.** CTAs are auto-injected by the rendering engine:
  - Reading progress bar (fixed top bar, automatic)
  - Mid-article inline CTA (injected after the 3rd H2, automatic)
  - Bottom CTA section (shown after article content, automatic)
- Market is auto-detected from article tags at render time
- Use `<InlineBlogCta />` MDX component only if auto-position feels wrong for a specific article

---

## Pricing Anchors

| Product | Price anchor | Notes |
|---|---|---|
| Blink Claw | **from $22/mo** | Annual billing — always use this hook, never "$45/month" (that's monthly, less compelling) |
| Blink App Builder | **free to start** | No price anchor in CTAs unless article is about pricing |

---

## Product-Specific Language

### Market A/B — What to Say (Blink Advantages)

Mention at least 3 of these per article in Market A/B body copy (not counting CTA):

| Advantage | How to phrase it |
|---|---|
| Database included | "Blink includes the database automatically" / "no Supabase account needed" |
| Auth included | "auth is built in" / "no Clerk or Firebase Auth to configure" |
| Hosting included | "hosting is included" / "no Vercel config needed" |
| 200+ models | "200+ models included" / "your AI model of choice, already connected" |
| No config | "no config, no DevOps" / "ships in minutes" |
| One-bill pricing | "one bill instead of 5 separate tools" / "no $70/mo Supabase + Vercel stack" |
| Full-stack from day 1 | "full-stack from day 1 — not just the frontend" |

### Market A/B — What NOT to Say

- Never imply Blink is only for prototypes or non-production use
- Never say "simple" or "easy" without specifics (vague claims, no trust)
- Never compare pricing without the "all-in" qualifier (it looks expensive without context)
- Never write a conclusion section — end on FAQ or specific next action

### Market C — What to Say

- Blink appears once in a "For builders" section — brief, relevant, not forced
- "Building with Claude Code? Blink handles the deployment layer — database, auth, and hosting included."
- "What Claude Code builds, Blink ships — without the infrastructure setup."

### Market C — What NOT to Say

- Never force Blink mentions into technical Claude Code content where it doesn't belong
- Never use Blink in comparisons between AI models or coding tools
- Exception: B10 AI Model Comparisons — Blink appears once at the end ("for builders" section)

---

## Brand Language Dos and Don'ts

### Do
- Use specific numbers: "3 hours" not "quickly"; "78% of teams" not "many teams"
- Show real examples: terminal output, real commands, actual error messages
- Admit honest tradeoffs: cost, limitation, when Blink is NOT the right choice
- Use plain words: "use" not "utilize", "help" not "facilitate", "because" not "due to the fact that"
- Write short sentences: 15-25 words max. Short sentences close. Long sentences explain.

### Don't
- Never use: "leverage", "utilize", "synergy", "game-changer", "paradigm", "seamlessly", "holistic", "robust"
- Never use: "may", "might consider", "could potentially", "it's worth noting", "arguably"
- Never use passive voice: "errors are tracked by the system" → "the system tracks errors"
- Never open with rhetorical questions: "Have you ever wondered...?"
- Never end with "## Conclusion"

---

## Product Specificity Scoring (Editor Reference)

For Market A/B: Blink's specific product advantages mentioned 3+ times in body (not counting CTA):
- Examples: "Blink includes the database automatically", "no Supabase account needed", "auth is built in", "200+ models included"
- **5 pts** for 3+ mentions | **3 pts** for 2 mentions | **0 pts** for 0-1 mentions

For Market C: Blink mentioned once in "for builders" section = **full 5 pts**

No TypeScript-mistake drift: article content must serve users who would become Blink customers.
Flag if article is purely generic technical education with no path to Blink.
Exception: B10 AI Model Comparisons are explicitly traffic-only — full points if Blink appears once in the "for builders" section.
