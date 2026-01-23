# Cursor Agents

Shared repository for custom Cursor AI agents. Version controlled for team collaboration and automatic syncing.

## Agents

| Agent | Purpose |
|-------|---------|
| `planner` | Step 1: Creates PRD at `.todo/{feature}/PRD.md` |
| `implementer` | Step 2: Implements the PRD or fixes verifier issues |
| `verifier` | Step 3: Reviews code, reports PASS or FAIL |
| `git-manager` | Commits only feature-related files with conventional format |
| `explorer` | Investigates codebase, traces call stacks, answers questions |

## Feature Development Flow

```
planner → implementer → verifier → (loop if FAIL) → git-manager
```

1. **planner** - Analyzes requirements, creates PRD
2. **implementer** - Builds the feature following PRD
3. **verifier** - Reviews and reports PASS/FAIL
4. **git-manager** - Commits only relevant files (never pushes)

## Setup

Symlink this folder to Cursor's agents directory:

```bash
ln -sf ~/Developer/agents ~/.cursor/agents
```

Or copy agents to Cursor:

```bash
cp -r ~/Developer/agents/* ~/.cursor/agents/
```

## Adding New Agents

Create a new `.md` file with frontmatter:

```markdown
---
name: agent-name
description: "One-line description shown in agent picker."
readonly: true  # optional - prevents file modifications
---

Agent instructions here...
```

## Syncing

Pull latest changes:

```bash
cd ~/Developer/agents && git pull
```

Push your changes:

```bash
cd ~/Developer/agents && git add -A && git commit -m "update agents" && git push
```
