# Agents & Skills

Unified location: `~/.agents/` — shared across Cursor, Claude, and other AI tools.

## What's Included

### Agents

Specialized subagents for development workflows:

- `explorer` — Codebase exploration and understanding
- `planner` — Creates PRDs for new features
- `implementer` — Implements PRDs and fixes issues
- `verifier` — Reviews code and reports pass/fail
- `git-manager` — Handles git commits

### Skills

Reusable patterns and templates:

- `team-saas` — Multi-tenant SaaS boilerplate
- `saas-sidebar` — Dashboard shell with team switcher
- `wysiwyg-editor` — Rich text editor components
- `kanban-dnd` — Drag-and-drop kanban board
- `bulk-select-actions` — Table selection with bulk actions
- `resend-inbound-emails` — Email inbox with Resend
- `railway-storage` — S3-compatible storage setup
- `nextjs-16-proxy` — Next.js 16 proxy convention

## Install

```bash
mkdir -p ~/.agents
ln -sfn "$(pwd)/agents" ~/.agents/agents
ln -sfn "$(pwd)/skills" ~/.agents/skills
```

Then symlink `~/.agents` to each agent:

```bash
ln -sfn ~/.agents ~/.cursor/agents
ln -sfn ~/.agents ~/.claude/agents
```

## Or Copy (no symlinks)

```bash
mkdir -p ~/.agents/agents ~/.agents/skills
cp -R ./agents/. ~/.agents/agents/
rsync -a --ignore-existing ./skills/ ~/.agents/skills/
```
