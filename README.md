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

### Rules

Custom instructions for AI agents:

- `always-agents-memory` — Always update AGENTS.md when user asks to remember something

### MCP Servers

Model Context Protocol servers for extending capabilities:

- `context7` — Up-to-date code documentation and examples (see `mcp/context7/README.md`)

## Install

Symlink agents and skills directly into each tool's config directory:

```bash
# Cursor
mkdir -p ~/.cursor/agents ~/.cursor/skills
ln -sfn "$(pwd)"/agents/*.md ~/.cursor/agents/
ln -sfn "$(pwd)"/skills/* ~/.cursor/skills/

# Claude Code / OpenCode
mkdir -p ~/.claude/agents ~/.claude/skills
ln -sfn "$(pwd)"/agents/*.md ~/.claude/agents/
ln -sfn "$(pwd)"/skills/* ~/.claude/skills/
```

For OpenCode skills, symlink to the global config:

```bash
ln -sfn ~/.agents/skills ~/.config/opencode/skills
```

## Or Copy (no symlinks)

```bash
# Cursor
mkdir -p ~/.cursor/agents ~/.cursor/skills
cp -R ./agents/. ~/.cursor/agents/
cp -R ./skills/. ~/.cursor/skills/

# Claude Code / OpenCode
mkdir -p ~/.claude/agents ~/.claude/skills
cp -R ./agents/. ~/.claude/agents/
cp -R ./skills/. ~/.claude/skills/
```

## OpenCode Configuration

To use these rules with OpenCode, add them to your global OpenCode config at `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "~/.agents/rules/*.md"
  ]
}
```

Skills are automatically discovered from `~/.config/opencode/skills/` after symlinking as shown above.

Each rule is structured as `/rules/rule-name.md` where the rule name uses kebab-case.

### MCP Servers Configuration

To configure MCP servers like Context7, add to your OpenCode config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["~/.agents/rules/*.md"],
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

See `mcp/context7/README.md` for detailed MCP setup instructions.
