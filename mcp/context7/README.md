# Context7 MCP Server

Context7 provides up-to-date code documentation and examples for libraries, frameworks, and APIs directly into your AI prompts.

## What it Does

- **Latest Documentation**: Fetches current docs from the source, not outdated training data
- **Code Examples**: Provides real working code examples
- **No Hallucinations**: Only returns actual APIs that exist
- **Version-Aware**: Matches documentation to specific versions you mention

## Installation

### Step 1: Get API Key (Optional but Recommended)

Get a free API key at [context7.com/dashboard](https://context7.com/dashboard) for higher rate limits.

### Step 2: Configure OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
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

### Step 3: Set Environment Variable

Add to `~/.zshrc` or `~/.bash_profile`:

```bash
export CONTEXT7_API_KEY="your_api_key_here"
```

Then reload: `source ~/.zshrc`

**Without API Key**: The config works without the headers, but with lower rate limits.

## Usage

Add `use context7` to your prompts:

```
Create a Next.js middleware that checks for JWT in cookies. use context7

Configure Cloudflare Worker to cache JSON responses for 5 minutes. use context7

Set up Supabase auth with cookies. use library /supabase/supabase. use context7
```

## Advanced

### Specify Library Directly

Skip library matching by using Context7 ID:

```
Implement basic authentication with Supabase. use library /supabase/supabase. use context7
```

### Specify Version

Mention the version in your prompt:

```
How do I set up Next.js 14 middleware? use context7
```

## Links

- [Context7 Website](https://context7.com)
- [Context7 Docs](https://context7.com/docs)
- [Get API Key](https://context7.com/dashboard)
- [GitHub Repo](https://github.com/upstash/context7)