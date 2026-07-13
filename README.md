# @borsapi/mcp-server

MCP (Model Context Protocol) server for [BörsAPI](https://borsapi.se) — query standardized Swedish financial data directly from AI tools like **Cursor**, **Claude Desktop**, and **Windsurf**.

MCP calls use the same API key and quota as the REST API.

## Requirements

- Node.js 18+
- A BörsAPI API key ([get one free at borsapi.se/dashboard](https://borsapi.se/dashboard))

## Installation

No global install required. MCP clients typically run the server via `npx`:

```bash
npx -y @borsapi/mcp-server
```

## Configuration

Set your API key as an environment variable:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BORSAPI_API_KEY` | Yes | — | Your BörsAPI API key (`fd_...`) |
| `BORSAPI_BASE_URL` | No | `https://borsapi.se` | API base URL (useful for local development) |

### Cursor

Add to `~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_your_api_key_here"
      }
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_your_api_key_here"
      }
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_your_api_key_here"
      }
    }
  }
}
```

### Local development

Point the server at a local Next.js instance:

```json
{
  "mcpServers": {
    "borsapi": {
      "command": "npx",
      "args": ["-y", "@borsapi/mcp-server"],
      "env": {
        "BORSAPI_API_KEY": "fd_your_api_key_here",
        "BORSAPI_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `search_companies` | Search and list Swedish listed companies |
| `get_company` | Get company details by UUID or ISIN |
| `get_company_coverage` | List available report periods and types for a company |
| `list_reports` | List financial reports with filters (type, period, entity) |
| `get_report` | Get a specific report for a period (consolidated RR+BR+KA) |
| `get_coverage_stats` | Database-wide statistics (no auth required) |
| `check_api_key` | Validate API key and check remaining quota |

### Sign convention

All financial data follows BörsAPI conventions:

- **Positive:** revenues, assets, cash inflows
- **Negative:** costs, expenses, taxes, liabilities, cash outflows

## Example prompts

Once configured, you can ask your AI assistant:

- "Search for Volvo on BörsAPI"
- "Get the 2024-Q3 income statement for H&M (HM-B)"
- "Which report periods are available for Atlas Copco?"
- "How much API quota do I have left?"

## Rate limits

MCP usage counts against the same quota as REST API calls:

| Tier | Limit |
|------|-------|
| Free | 100 reports total (lifetime) |
| Hobby | 100 reports per day |
| Pro | 500 reports per day |

Each financial report returned counts as 1 unit. Listing companies or checking your key costs 1 unit.

Use the `check_api_key` tool to inspect remaining quota.

## Development

From the monorepo root:

```bash
cd packages/mcp-server
npm install
npm run build
npm test
```

Run locally:

```bash
BORSAPI_API_KEY=fd_your_key npm start
```

## License

MIT © BörsAPI AB
