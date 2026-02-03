# MCP Servers for OpenCode

Model Context Protocol (MCP) servers extend OpenCode's capabilities by connecting to external systems, data sources, and tools.

## What is MCP?

MCP is an open-source standard for connecting AI applications to external systems. Think of it like USB-C for AI applications — a standardized way to connect LLMs to data sources (databases, local files), tools (search engines, calculators), and workflows.

**Learn more**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## How it Works in OpenCode

1. Configure MCP servers in your OpenCode config
2. OpenCode connects to each server and discovers available tools
3. Tools are automatically available to the LLM alongside built-in tools
4. Use tools in your prompts by referencing the server name

## Installation

### Step 1: Edit OpenCode Config

Edit your global config at `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "server-name": {
      "type": "local" | "remote",
      // ... config
    }
  }
}
```

### Step 2: Configure Server Type

**Local MCP servers** (run on your machine):
```json
{
  "mcp": {
    "my-local-server": {
      "type": "local",
      "command": ["npx", "-y", "@namespace/server-package"],
      "environment": {
        "MY_VAR": "value"
      },
      "enabled": true
    }
  }
}
```

**Remote MCP servers** (hosted URLs):
```json
{
  "mcp": {
    "my-remote-server": {
      "type": "remote",
      "url": "https://mcp.example.com",
      "headers": {
        "Authorization": "Bearer {env:API_KEY}"
      },
      "enabled": true
    }
  }
}
```

### Step 3: Environment Variables

Use `{env:VAR_NAME}` in your config for variable values that are stored in your shell:

```bash
# Add to ~/.zshrc or ~/.bash_profile
export API_KEY="your_key_here"
```

## Authentication

### API Keys

```json
{
  "headers": {
    "API_KEY": "{env:MY_API_KEY}"
  }
}
```

### OAuth

OpenCode automatically handles OAuth for remote servers. Just configure the URL and it will prompt for authentication if needed:

```json
{
  "url": "https://mcp.example.com/mcp/oauth"
}
```

To disable auto-OAuth (e.g., for API key auth):
```json
{
  "oauth": false
}
```

## Managing MCP Servers

### Enable/Disable

```json
{
  "mcp": {
    "server-name": {
      "enabled": false
    }
  }
}
```

### Per-Agent Configuration

To only enable certain MCP servers per agent, disable globally and enable per-agent:

```json
{
  "tools": {
    "my-mcp-*": false
  },
  "agent": {
    "my-agent": {
      "tools": {
        "my-mcp-*": true
      }
    }
  }
}
```

## Usage Examples

Once configured, MCP tools are available in prompts:

```
Search GitHub code examples for React hooks. use gh_grep

Get latest Next.js documentation for middleware. use context7

Query Sentry for recent errors. use sentry
```

## Available MCP Servers

See `mcp/` subdirectories for specific server setup:

- [`context7/`](./context7/) — Up-to-date code documentation
- Add more...

## Important Notes

⚠️ **Context Usage**: MCP servers add to your context. Be selective with which servers you enable to avoid exceeding limits.

⚠️ **Some servers are heavy**: Servers like GitHub MCP add a lot of tokens. Consider disabling them when not needed.

## Official OpenCode MCP Docs

See [OpenCode MCP Documentation](https://opencode.ai/docs/mcp-servers) for complete reference and examples.