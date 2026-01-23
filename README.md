# Cursor / Claude Agents

Run from repo root:

```bash
mkdir -p ~/.cursor ~/.claude
ln -sfn "$(pwd)/agents" ~/.cursor/agents
ln -sfn "$(pwd)/agents" ~/.claude/agents
```

Or copy agents (no symlinks):

```bash
mkdir -p ~/.cursor/agents
mkdir -p ~/.claude/agents
cp -R ./agents/. ~/.cursor/agents/
cp -R ./agents/. ~/.claude/agents/
```
