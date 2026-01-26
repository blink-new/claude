# Cursor / Claude Agents & Skills

## Agents

Run from repo root:

```bash
mkdir -p ~/.cursor ~/.claude
ln -sfn "$(pwd)/agents" ~/.cursor/agents
ln -sfn "$(pwd)/agents" ~/.claude/agents
```

Or copy agents (no symlinks):

```bash
mkdir -p ~/.cursor/agents ~/.claude/agents
cp -R ./agents/. ~/.cursor/agents/
cp -R ./agents/. ~/.claude/agents/
```

## Skills

Copy skills without overwriting existing ones:

```bash
mkdir -p ~/.cursor/skills ~/.claude/skills
rsync -a --ignore-existing ./skills/ ~/.cursor/skills/
rsync -a --ignore-existing ./skills/ ~/.claude/skills/
```
