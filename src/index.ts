import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BorsApiClient } from "./client.js";
import { loadConfig } from "./config.js";
import { registerTools } from "./tools/index.js";

export async function main(): Promise<void> {
  const config = loadConfig();
  const client = new BorsApiClient(config);

  const server = new McpServer({
    name: "borsapi",
    version: "1.0.0",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start BörsAPI MCP server: ${message}`);
  process.exit(1);
});
