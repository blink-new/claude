# Blink — Content Markets Configuration

Three active markets. Each article belongs to exactly one market. The market determines the CTA, product mention style, and competitive angle.

---

## Market Detection Signals

| If the article is about... | Market |
|---|---|
| OpenClaw, Blink Claw, ClawHub, managed OpenClaw hosting | **A** |
| Vibe coding, AI app builders, no-code, "how to build X", team use cases, replace SaaS | **B** |
| Claude Code, agentic coding, AI coding agents, MCP, CLAUDE.md, context engineering | **C** |

**ALWAYS check which market a cluster belongs to before writing a CTA. Market A → Blink Claw. Market B and C → Blink App Builder.**

---

## Market A — OpenClaw / Blink Claw

**Market ID:** A

**Product:** Blink Claw (blink.new/claw) — managed OpenClaw hosting

**Conversion goal:** OpenClaw searcher → Blink Claw signup

**CTA (exact copy — use verbatim):**
```
Run OpenClaw without the hassle — Blink Claw handles everything from $22/mo → blink.new/claw
```

**Short CTA variant (for inline body references):**
```
Blink Claw from $22/mo → blink.new/claw
```

**Competitive advantage:** We ARE the product. Competitors write about OpenClaw but cannot offer managed hosting.

**Key talking points:**
- $22/mo annual (all-in — LLM costs included via 200+ model router)
- No Docker needed, no VPS setup
- 30+ data center regions
- DA 80+ blog vs competitors at DA 5-30

**Primary competitors:** clawctl.com (DA 20), clawhosters.com (DA 15), clawhub.biz (DA 18)

**Product mention style (Market A articles):**
- Mention Blink Claw 2-3 times in body (outside CTA)
- Emphasize: all-in pricing, 200+ models included, no self-hosting complexity
- Example: "Blink Claw handles everything — no Docker, no VPS, $22/month all-in"

**Tags that trigger Market A CTA in rendering engine:**
`openclaw`, `blink claw`, `clawdbot`, `moltbot`

---

## Market B — AI App Builder / Vibe Coding

**Market ID:** B

**Product:** Blink AI App Builder (blink.new)

**Conversion goal:** "Build an app" / "vibe coding" searcher → Blink free trial → paid plan

**CTA (exact copy — use verbatim):**
```
Build this with Blink — database, auth, and hosting included. No config needed → blink.new
```

**Short CTA variant:**
```
Build this with Blink — everything included → blink.new
```

**Competitive advantage:** Complete platform (DB + auth + storage + backend + deploy all included). Competitors are frontend-only or code editors that still require you to wire infra yourself.

**Key differentiator:** Deploy in minutes. No Supabase account. No Vercel config. No separate auth. Everything included.

**Audience split:**
1. Non-technical founders who want to build a product idea
2. Developers who want to build faster
3. Indie hackers / solopreneurs going 0→1

**Primary competitors:** Lovable, Bolt.new, Replit, v0, Cursor, Windsurf, Base44, Emergent.sh

**Product mention style (Market B articles):**
- Mention Blink 3+ times in body (outside CTA)
- After each infrastructure step: "With Blink, [step] is handled automatically — no [Supabase/Vercel/Stripe config] needed."
- Minimum 3 Blink-specific product mentions in body

**Tags that trigger Market B CTA in rendering engine:**
Any tags not in Market A or C list → App Builder CTA → blink.new

---

## Market C — Claude Code / Agentic Coding

**Market ID:** C

**Product:** Blink AI App Builder (blink.new) — positioned as "where you deploy what Claude Code builds"

**Conversion goal:** Developer using AI coding tools → discovers Blink → uses Blink as the backend/deployment layer

**CTA (exact copy — use verbatim):**
```
Building with Claude Code? Deploy on Blink — database, auth, and hosting included → blink.new
```

**Short CTA variant:**
```
Deploy on Blink — everything included → blink.new
```

**Why we can win:** DA 80+ vs nearly all competitors (most Claude Code content is on Medium, dev.to, Reddit, Substack — DA 20-50). We use these tools to build Blink itself — genuine E-E-A-T.

**Audience:** Professional developers, indie hackers, engineering leads, AI-native builders

**Primary competitors (content producers, not products):** Medium, dev.to, YouTube tutorials, Reddit r/ClaudeAI

**Product mention style (Market C articles):**
- Write objectively and accurately for 90% of the article
- Blink appears once in the "For builders" section and once in the CTA
- Do NOT force Blink into technical content where it doesn't belong
- Example section: "## For Builders: Where to Deploy What You Build / Building with Claude Code? Blink includes database, auth, and hosting automatically."

**Tags that trigger Market C CTA in rendering engine:**
`claude code`, `agentic coding`, `mcp`, `context engineering`
