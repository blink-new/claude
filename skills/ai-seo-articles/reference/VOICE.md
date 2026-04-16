---
name: voice
description: Writing voice calibration for SEO articles. Read this BEFORE SOP.md. Built entirely from real quotes from the reference articles — not invented examples.
---

# Writing Voice

Read this immediately after the brief — before SOP.md. These rules are sourced directly from five reference articles. Every example below is a real quote.

**Reference articles (read them, they are the calibration):**
- https://posthog.com/blog/testing-ai-agents
- https://posthog.com/blog/standup-bot-revenge
- https://posthog.com/blog/best-error-tracking-tools
- https://plausible.io/blog/backlinks-seo-guide
- https://plausible.io/blog/european-privacy-friendly-tools-for-business

---

## Rule 1 — Open cold. No warmup.

The first sentence carries full weight. Drop into the substance.

**How it actually looks:**

> *"There it is. Staring at me. Sitting there. Goading me."*
> — PostHog standup bot. Four one-sentence paragraphs. No setup.

> *"Software testing used to be relatively straightforward."*
> — PostHog testing agents. One sentence. Then a paragraph explaining what changed. Then: "AI agents changed this."

> *"Every developer has shipped a bug that slipped through tests: no one is perfect."*
> — PostHog error tracking. Universal truth, zero warmup, colon to land the consequence.

> *"Backlinks are when another website (another domain) links back to you."*
> — Plausible backlinks. Bare definition. Not even a sentence about why you should care first.

**What to avoid:** Any sentence that exists to set context before the real content. "In today's world..." / "Whether you're a developer or..." / "Have you ever wondered..." — none of these appear anywhere in the reference articles.

---

## Rule 2 — Short sentences land the point.

Long sentences explain. Short sentences close. The rhythm is: explain → land → move on.

**Real landing sentences from the articles:**

> *"AI agents changed this."*
> — 4 words, after two paragraphs explaining how software testing used to work.

> *"After a few months of this, I snapped."*
> — 8 words, after describing months of copy-pasting standup updates.

> *"It was a mess."*
> — 4 words, after describing a three-agent architecture that wasn't working.

> *"It's not that simple."*
> — 5 words, after the reader thinks they've understood backlinks.

> *"Enter, error tracking tools."*
> — 4 words, after "What matters is how quickly you find out, understand the cause, and ship a fix."

> *"The irony was too much."*
> — 5 words, after "I work on LLM analytics at PostHog. I spend my days helping people understand what their AI agents are doing. And yet here I am, manually summarizing my GitHub activity like some kind of caveman."

The pattern: two or three sentences of explanation or context, then a short sentence that closes the point and creates forward momentum.

---

## Rule 2.5 — 1–2 sentence paragraphs. Max 3.

The standup bot article opens with four consecutive one-sentence paragraphs:

> *"There it is. Staring at me. Sitting there. Goading me."*

Each clause is its own paragraph. That's intentional. One-sentence paragraphs land harder than anything else.

From the testing article, this is a standalone paragraph:

> *"AI agents changed this."*

From the standup bot:

> *"After a few months of this, I snapped."*

> *"Did I save any time compared to just writing the standup myself? Debatable."*

> *"Might there be some AI slop in my updates that slipped through? Most definitely."*

Those last three are each their own paragraph. Not a list. Not one paragraph with three sentences. Three separate paragraphs.

**The rule in practice:** Write one idea. Stop. New paragraph for the next idea. Four sentences in one paragraph means you've combined four ideas — break it up.

---

## Rule 3 — Show the actual thing, not a description of it.

When the article references what something does, show the real output.

**From the standup bot:**

Rather than "the agent displays a summary of your GitHub activity," the article shows the actual feed the agent sees:

> *"Activity Feed: 94 events in last 1 day(s)*
> *Summary: 2 comment, 2 create, 4 issue, 13 pull_request, 26 push, 26 review, 21 review_comment*
> *Events (newest first):*
> *[2026-04-02 12:42] PUSH PostHog/posthog (master)*
> *[2026-04-02 12:42] PR MERGED PostHog/posthog#53107 - feat/llma-cluster-mcp-tools"*

Rather than "users sometimes express frustration," the article quotes actual messages from real sessions:

> *"Some highlights from my standup sessions: 'bad bad bad!!!!!' / 'ok this is terrible im going to exit and debug - how can this happen!' / 'you messed up the links'"*

**From the Plausible backlinks article,** explaining dofollow links while also demonstrating them:

> *"A ['dofollow' link](https://www.semrush.com/blog/dofollow-link/) (I just backlinked to Semrush for dofollow links btw, this is backlinking live in action)"*

The article is not describing how dofollow links work. It is doing one, in real time, while explaining it.

**From the error tracking article:**

> *"The repository has 29.8k+ stars, 360+ contributors, and sees daily commits from both the core team and community."*

Not "has a large and active community." Specific numbers, specific actions.

---

## Rule 4 — Admit the failure. It builds trust.

Every article in this list admits something went wrong, took longer than expected, or fell short of the ideal.

**The standup bot article is the best example:**

> *"I'll be honest - I didn't start here. My first version was a three-agent system... It was a mess. Debugging handoffs between agents was painful."*

> *"So I ripped it all out — deleted the coordinator, data gatherer, and summarizer... The result was 300 fewer lines of code and something that actually worked reliably."*

> *"Did I save any time compared to just writing the standup myself? Debatable. Might there be some AI slop in my updates that slipped through? Most definitely."*

**From the testing article:**

> *"That still leaves one major problem. We now have tests for our agent, just like we do for typical software, but there is a caveat: the input space for what can go into our agent is effectively infinite, yet we are only testing a subset of it."*

**From the Plausible backlinks article:**

> *"That's how we've done it at Plausible. We've generated hundreds of thousands of backlinks but never worked on getting a single backlink manually."*

That sentence is credible because it's specific. Not "we focus on organic methods." The actual number (hundreds of thousands), the actual behavior (never once did it manually).

**From the error tracking article:**

> *"We're biased, obviously, but PostHog is the best choice for error tracking if:"*

Transparent self-disclosure before making a recommendation. The "obviously" is the credibility move — not the humility of it, but the directness.

---

## Rule 5 — Headers say what the section IS, not what it's about.

**PostHog standup bot section headers:**
- *"The plan"*
- *"The architecture: one agent to rule them all"*
- *"Stealing my own GitHub activity"*
- *"The secret sauce: PostHog LLM analytics"*
- *"The victory lap: posting to Slack"*

**PostHog testing agents section headers:**
- *"The birth of the agent"*
- *"Reproducing bugs from your agent's first users"*
- *"Your agent gets popular, tests get automated"*
- *"Embracing the infinite possibilities of your agent"*
- *"Building evaluations by manually reviewing traces"*
- *"Testing agents isn't one size fits all"*

**Plausible backlinks section headers:**
- *"Good vs okay vs bad backlinks"*
- *"They come from reputed domains"*
- *"How not to get backlinks?"*

Notice what's not here: "Introduction," "Overview," "Benefits," "Implementation," "Conclusion," "Summary." None of those appear in any of the five articles.

The headers tell you the story. Reading just the headers, you know what happened and in what order.

---

## Rule 6 — End on the specific thing to do.

Not "explore," not "consider starting," not a summary paragraph.

**PostHog testing article ends with:**

> *"If you are just getting started, you do not need a huge eval platform on day one. Start with tracing, one small dataset built from real user queries and recent bugs, one or two cheap code-based evaluators, one LLM-as-a-Judge evaluator for a subjective criterion, and a regular trace review ritual. That is enough to move from testing your agent by vibes to operating a real quality system."*

Three sentences. Specific steps. No "we hope this guide has been helpful."

**PostHog standup bot ends with:**

> *"The standup bot still messages me at 6 PM. But now I just smile, run `standup generate`, and let my agent do the talking."*

The actual command. The actual result. Done.

**`## Conclusion` does not appear in any of the five reference articles.** Not once.

---

## Rule 7 — Narrative arc: each section ends naming the next gap.

The testing article is the clearest example. Reading only the endings of each section:

- *"The birth of the agent"* → ends: "you now spend a lot of time looking at traces"
- *"Reproducing bugs"* → ends: "you want to win back some time from reactively fixing bugs"
- *"Tests get automated"* → ends: "the input space for what can go into our agent is effectively infinite, yet we are only testing a subset of it"
- *"Embracing the infinite possibilities"* → ends: "you still only evaluate the things that you have defined as evaluators"
- *"Building evaluations by manually reviewing traces"* → the cycle completes

Each section explicitly names the problem that the next section will solve. Not implicitly — the sentence is there. The reader cannot stop because each section ends mid-problem.

Contrast this with "Step 1, Step 2, Step 3" where each step is self-contained and there's no reason not to stop reading.

---

## Rule 8 — Personal stakes, only when real.

**From the standup bot article:**

> *"I work on LLM analytics at PostHog. I spend my days helping people understand what their AI agents are doing. And yet here I am, manually summarizing my GitHub activity like some kind of caveman. The irony was too much."*

The credibility comes from the specific irony — not "I'm passionate about AI" but "I literally build AI observability tools and I'm doing this by hand."

> *"Fun fact — it was built during a one-day hackathon at a team onsite in Barcelona, where I also discovered Calçots (highly recommend)."*

This is relevant because it explains how fast the integration was to build. The Calçots detail is there because it's true, not because it makes the author seem personable.

**From the Plausible European tools article:**

> *"P.S. We use BunnyCDN at Plausible and have been happy users for a long time now."*

> *"P.S. We use Whereby at Plausible for internal video calls."*

> *"At Plausible, we also use Hetzner ourselves. All the data is hosted on servers owned by Hetzner in Germany, and the data never leaves the EU."*

Personal use disclosures. All specific, all verifiable, all relevant to the recommendation being made.

**What makes this work:** the disclosure is a specific fact, not a sentiment. "We use BunnyCDN" not "we love BunnyCDN."

---

## Rule 9 — Comparison articles: honest praise for competitors first.

Every competitor section in the PostHog error tracking article leads with genuine, specific strengths:

> *"Sentry is a mature, battle-tested error and performance monitoring tool used across industries. It's stable, deeply integrated, and built for teams who value visibility over novelty."*

> *"Rollbar specializes in tracking when new releases cause errors... If you value velocity and automation over depth, this is a tool that can help you ship multiple times a day without fear."*

> *"GlitchTip's simplicity is also its strength: no over-engineered dashboards, no surprise upgrades, no opaque billing – just a clean UI, grouped errors, and self-hosted reliability for small teams."*

These are honest. "Built for teams who value visibility over novelty" is not a backhanded compliment — it means exactly what it says. "Simplicity is also its strength" is specific about what makes GlitchTip good, not just what makes it less capable than PostHog.

The structure that does NOT appear: "While [Tool] offers some basic functionality, it lacks the comprehensive capabilities that modern teams need." That construction is in none of the five articles.

---

## Rule 10 — Never write these.

| Category | What to cut |
|---|---|
| Buzzwords | leverage, utilize, synergy, game-changer, paradigm, seamlessly, holistic, robust |
| Hedges | may, might consider, could potentially, it's worth noting, arguably |
| Passive voice | "errors are tracked by the system" → "the system tracks errors" |
| Rhetorical openers | "Have you ever wondered...?" |
| Ending section | `## Conclusion` — use a specific next action or close on the FAQ |

---

## Blueprint Cheat Sheet

These are the five structural patterns drawn from the reference articles. The details are in SOP.md.

**A — Tutorial / Narrative Arc** (PostHog testing agents)
Each section ends naming the remaining gap. The next section opens by restating that gap before solving it. Close with a concrete starting point — not a summary of what was covered.

**B — Personal Narrative + Tutorial** (PostHog standup bot)
Opens with personal stakes and specific irony. Names and then admits the failed first attempt ("I'll be honest — I didn't start here"). Shows what actually worked, with real output. Ends with an honest admission and the actual command to run.

**C — Comparison / Tool Roundup** (PostHog error tracking)
"What features do you need?" first. Each competitor entry leads with genuine specific strengths. Closes with a decision guide and transparent self-disclosure ("We're biased, obviously, but...").

**D — Comprehensive Educational** (Plausible backlinks)
Opens with a bare definition. Covers why it matters, the good-vs-bad breakdown, how to do it, then how NOT to do it. The inversion section ("How not to get backlinks?") is where the article earns the most trust. Close with what to do today.

**E — Curated List** (Plausible European tools)
States selection criteria up front. Consistent entry format throughout. Personal use disclosures ("P.S. We use this ourselves") appear as specific facts, not as warmth. Closes briefly — not with a "final thoughts" summary paragraph.
