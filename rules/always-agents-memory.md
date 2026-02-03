# Always Update AGENTS.md

Whenever the user tells you to remember something about the project (e.g., "remember that...", "keep in mind that...", "note that...", or similar phrases), you MUST immediately create or update the `AGENTS.md` file in the project root with this information.

This rule is automatically loaded when you configure OpenCode with the rules symlink.

## Instructions

1. When user mentions remembering or noting something about the project, identify it as information that should be persisted
2. If `AGENTS.md` doesn't exist, create it in the project root
3. Append the information to the `AGENTS.md` file in a clear, organized manner
4. Format it with proper markdown structure with headers, lists, and sections as appropriate
5. Use a consistent format that makes it easy to reference and understand the project context

This ensures that important project context and requirements are persisted and available across all opencode sessions.

## Setup

To enable this rule globally, configure OpenCode at `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "~/.agents/rules/*.md"
  ]
}
```