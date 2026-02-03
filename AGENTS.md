# Agents, Skills, & Rules

This repository provides a unified collection of specialized agents, reusable skills, and custom rules for AI development tools (OpenCode, Cursor, Claude).

## Overview

- **Agents**: Specialized subagents for specific development workflows
- **Skills**: Reusable patterns, templates, and best practices
- **Rules**: Custom instructions that apply globally to all AI interactions

## Structure

```
/
├── agents/              # Agent definitions (markdown files)
│   ├── explorer.md
│   ├── planner.md
│   ├── implementer.md
│   ├── verifier.md
│   └── git-manager.md
├── skills/              # Skill definitions (directories with SKILL.md)
│   ├── team-saas/
│   │   └── SKILL.md
│   ├── saas-sidebar/
│   │   └── SKILL.md
│   └── ...
└── rules/               # Rule definitions (markdown files)
    ├── always-agents-memory.md
    └── ...
```

## Installation

Install to `~/.agents/` (shared across AI tools):

```bash
# Create symlinks
mkdir -p ~/.agents
ln -sfn "$(pwd)/agents" ~/.agents/agents
ln -sfn "$(pwd)/skills" ~/.agents/skills
ln -sfn "$(pwd)/rules" ~/.agents/rules

# Link to specific tools
ln -sfn ~/.agents ~/.cursor/agents
ln -sfn ~/.agents ~/.claude/agents
```

## For OpenCode

Add rules to your OpenCode config at `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "$(pwd)/rules/*.md"
  ]
}
```

## Agents

### Available Agents

- **explorer**: Codebase exploration - understand how something works, find logic, trace call stacks (readonly)
- **planner**: Creates PRDs for new features (Step 1 of feature development)
- **implementer**: Implements PRDs and fixes issues (Step 2 of feature development)
- **verifier**: Reviews code and reports pass/fail (Step 3 of feature development)
- **git-manager**: Handles git commits

### Developer Workflow

1. **Explorer** - When you need to understand existing code
2. **Planner** - When building a new feature (creates PRD)
3. **Implementer** - When implementing from PRD or fixing verifier issues
4. **Verifier** - After implementation completes (loops back to implementer if issues)
5. **Git-manager** - Always after verifier passes

### Agent Format

Each agent is a markdown file with frontmatter defining metadata:

```yaml
---
name: planner
description: "Step 1 of feature development. Creates PRD at .todo/{feature-name}/PRD.md"
readonly: false
---
```

## Skills

### Available Skills

- `team-saas`: Multi-tenant SaaS boilerplate
- `saas-sidebar`: Dashboard shell with team switcher
- `wysiwyg-editor`: Rich text editor components
- `kanban-dnd`: Drag-and-drop kanban board
- `bulk-select-actions`: Table selection with bulk actions
- `resend-inbound-emails`: Email inbox with Resend
- `railway-storage`: S3-compatible storage setup
- `nextjs-16-proxy`: Next.js 16 proxy convention
- Plus more specialized skills

### Skill Format

Each skill is a directory containing `SKILL.md` and optional assets:

```
skill-name/
├── SKILL.md      # Main skill documentation
├── assets/       # Code templates, schemas, images
└── scripts/      # Setup/migration scripts
```

## Rules

### What are Rules?

Rules are custom instructions that apply globally to all AI interactions. They enforce consistent behavior across sessions.

### Rule Format

Each rule is a markdown file with kebab-case naming:

```
rules/rule-name.md
```

Example rule triggers:
- "remember that..."
- "keep in mind that..."
- "note that..."

The `always-agents-memory` rule automatically updates `AGENTS.md` when the user wants to persist project context.

## Adding New Content

### New Agent

Create `agents/new-agent.md` with frontmatter:
```yaml
---
name: new-agent
description: "What this agent does"
readonly: true/false
---
```

### New Skill

Create directory with `SKILL.md`:
```bash
mkdir -p skills/new-skill
# Write SKILL.md and add any assets/
```

### New Rule

Create markdown file with kebab-case naming:
```bash
# Write rules/new-rule.md
```

## File Naming Conventions

- **Agents**: `kebab-case.md`
- **Skills**: `kebab-case/`
- **Rules**: `kebab-case.md`

## Version Control

All definitions in this repo should be tracked in git. Users can pin to specific versions or update to latest as needed.