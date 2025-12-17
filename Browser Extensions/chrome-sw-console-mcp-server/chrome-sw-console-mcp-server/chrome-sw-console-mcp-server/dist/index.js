#!/usr/bin/env node
/**
 * Chrome Service Worker Console MCP Server
 *
 * This MCP server provides tools to monitor console messages from Chrome extension
 * service workers using the Chrome DevTools Protocol.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { registerTools } from "./tools/index.js";
/**
 * Initialize the MCP server
 */
const server = new McpServer({
    name: "chrome-sw-console-mcp-server",
    version: "1.0.0",
});
/**
 * Register all tools
 */
registerTools(server);
/**
 * Run server with stdio transport (for local integrations)
 */
async function runStdio() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Chrome Service Worker Console MCP server running on stdio");
}
/**
 * Run server with HTTP transport (for remote access)
 */
async function runHTTP() {
    const app = express();
    app.use(express.json());
    app.post("/mcp", async (req, res) => {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        res.on("close", () => transport.close());
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    const port = parseInt(process.env.PORT || "3000");
    app.listen(port, () => {
        console.error(`Chrome Service Worker Console MCP server running on http://localhost:${port}/mcp`);
    });
}
/**
 * Main entry point
 */
async function main() {
    const transport = process.env.TRANSPORT || "stdio";
    if (transport === "http") {
        await runHTTP();
    }
    else {
        await runStdio();
    }
}
// Start the server
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map