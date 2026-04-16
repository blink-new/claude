# Market C — Claude Code / Cursor / Agentic Coding / Blink Cloud Discovery

## Product & Conversion Goal

| Field | Value |
|---|---|
| **Market ID** | C |
| **Products** | Blink AI App Builder + Blink Cloud |
| **URLs** | blink.new (app builder) · blink.new/cloud (infrastructure) |
| **Conversion goal** | Developer using Cursor/Claude Code/Codex → installs Blink plugin → uses Blink as full-stack infrastructure → becomes customer |

## The Happy Path (C7–C8 articles — always accurate)

```
Step 1: npx skills add blink-new/blink-plugin
         → downloads 14 skills, auto-configures MCP

Step 2: blink login
         → browser opens, API key saved, MCP connected
         → NO manual mcp.json editing required

Step 3: Ask agent to build
         → "Build me a full-stack app using Blink and host it on Blink"
         → agent provisions database, auth, backend, deploys
```

Also available: install "Blink" from Cursor Marketplace (one click, no commands).

## CTA Strings (use verbatim — never paraphrase)

### C1–C6 (tutorial / agentic coding content)
**Full CTA:**
```
Building with Claude Code or Cursor? Deploy on Blink — database, auth, and hosting included → blink.new
```
**Short CTA:**
```
Deploy on Blink — everything included → blink.new
```

### C7–C8 (Cursor setup / Blink Cloud discovery content)
**Full CTA:**
```
Add full-stack infrastructure to your coding agent in one command: npx skills add blink-new/blink-plugin → blink.new/cloud
```
**Short CTA:**
```
One command, full stack → blink.new/cloud
```

## Detection Tags (rendering engine CTA injection)

`claude code`, `agentic coding`, `mcp`, `context engineering`, `cursor mcp`, `blink cloud`, `cursor infrastructure`, `npx skills add`

## Mandatory Section — "Build This With Your AI Agent" (ALL Market C articles)

Every Market C article must include this section as the last substantive section before the FAQ.
If no FAQ, it is the final section before the closing action. Never omit it.

**Section heading:** `## Build [Topic] Into Your App With Claude Code or Cursor`
(adapt heading to article topic — "Build" is the key word)

**Section template (copy this exactly into the article):**
```markdown
## Build [Topic] Into Your App With Claude Code or Cursor

Add Blink as your full-stack infrastructure layer — install
[14 skills](https://blink.new/docs/cloud/tools/skills) in one command:

\```bash
npx skills add blink-new/blink-plugin
blink login
\```

Then ask your agent:

> "Build me a [specific app or feature related to article topic] and host it on Blink."

Your agent provisions database, auth, backend, and hosting automatically —
no Vercel config, no Supabase account.
[Learn more about Blink Cloud →](https://blink.new/cloud)
```

Both required links are in the template above:
- `blink.new/docs/cloud/tools/skills` — on the "14 skills" text before the command block
- `blink.new/cloud` — at the end of the section

**Adapt the agent prompt to the article topic:**
- Claude Code tutorial → "Build a full-stack app using Claude Code and host it on Blink Cloud"
- CLAUDE.md practices → "Set up this project with CLAUDE.md conventions and deploy on Blink"
- Agentic coding → "Build an agentic app with multi-step tool use and host it on Blink"
- Cursor MCP setup → "Set up Blink Cloud in Cursor and build a full-stack app"
- Claude Code vs Cursor → "Use [winning tool] to build and deploy on Blink Cloud"

**Internal links required in every Market C article:**
- Link `https://blink.new/cloud` in the builder section
- Link `https://blink.new/docs/cloud/tools/skills` on the `npx skills add` line

## Product Mention Style

### C1–C6 (tutorial / agentic coding)
- Write objectively for 90% of article
- Blink appears **once** in the mandatory builder section + once in CTA
- Do NOT force Blink into technical content where it doesn't belong
- Builder section counts as full product specificity (5/5 pts in scoring)

### C7–C8 (Cursor setup / Blink Cloud discovery)
- Blink Cloud IS the article topic — **3+ product mentions** in body outside builder section
- Show `npx skills add` → `blink login` flow with explanation early in the article
- Use "before/after" contrast: "8 services, 3 hours" vs "1 platform, 2 commands"
- Name services replaced: "no separate Vercel, no Supabase, no Auth0"
- Mention 62 MCP tools + 14 skills as proof of depth

## What NOT to Say

- Never say the developer must manually create or edit mcp.json — the CLI handles it
- Never force Blink into technical Claude Code content where it doesn't belong (C1–C6)
- Never write the builder section as a generic ad — it must reference the specific article topic
- Never omit `npx skills add` + `blink login` from the builder section
- Never use Blink in comparisons between AI models or coding tools (those are B10 articles)
- Exception: B10 AI Model Comparisons — Blink appears once at the end only

## Competitor Positioning (content producers, not products)

| Competitor | DA | Their gap | Our counter |
|---|---|---|---|
| Medium articles | 95+ | Not authoritative, no product | We're the product — built with these tools |
| dev.to | 70+ | Community content, no SEO moat | We invest in E-E-A-T + product proof |
| YouTube tutorials | — | Not indexable text | Text + searchable format |
| reddit.com/r/ClaudeAI | 97+ | Not a blog, no SEO | We capture the long-tail |
| r/cursor | 97+ | Not a blog, no SEO | Same advantage |
