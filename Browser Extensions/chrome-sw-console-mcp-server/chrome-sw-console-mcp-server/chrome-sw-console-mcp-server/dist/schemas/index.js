/**
 * Zod validation schemas for MCP tool inputs
 */
import { z } from "zod";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../constants.js";
/**
 * Response format enum
 */
export const ResponseFormatSchema = z.enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable");
/**
 * Console message level enum
 */
export const LogLevelSchema = z.enum(["log", "info", "warn", "error", "debug"])
    .optional()
    .describe("Filter by log level");
/**
 * List targets input schema
 */
export const ListTargetsInputSchema = z.object({
    response_format: ResponseFormatSchema,
    chrome_host: z.string()
        .default("localhost")
        .describe("Chrome DevTools host (default: localhost)"),
    chrome_port: z.number()
        .int()
        .min(1024)
        .max(65535)
        .default(9222)
        .describe("Chrome DevTools port (default: 9222)"),
}).strict();
/**
 * Connect to target input schema
 */
export const ConnectToTargetInputSchema = z.object({
    target_id: z.string()
        .min(1)
        .describe("The Chrome target ID to connect to (from list_targets)"),
    chrome_host: z.string()
        .default("localhost")
        .describe("Chrome DevTools host (default: localhost)"),
    chrome_port: z.number()
        .int()
        .min(1024)
        .max(65535)
        .default(9222)
        .describe("Chrome DevTools port (default: 9222)"),
}).strict();
/**
 * Start monitoring input schema
 */
export const StartMonitoringInputSchema = z.object({}).strict();
/**
 * Stop monitoring input schema
 */
export const StopMonitoringInputSchema = z.object({}).strict();
/**
 * Get console logs input schema
 */
export const GetConsoleLogsInputSchema = z.object({
    response_format: ResponseFormatSchema,
    limit: z.number()
        .int()
        .min(1)
        .max(MAX_LIMIT)
        .default(DEFAULT_LIMIT)
        .describe(`Maximum number of logs to return (1-${MAX_LIMIT}, default: ${DEFAULT_LIMIT})`),
    level: LogLevelSchema,
    start_time: z.number()
        .int()
        .positive()
        .optional()
        .describe("Filter logs after this Unix timestamp (milliseconds)"),
    end_time: z.number()
        .int()
        .positive()
        .optional()
        .describe("Filter logs before this Unix timestamp (milliseconds)"),
    text_contains: z.string()
        .optional()
        .describe("Filter logs containing this text (case-insensitive)"),
}).strict();
/**
 * Clear logs input schema
 */
export const ClearLogsInputSchema = z.object({}).strict();
/**
 * Get status input schema
 */
export const GetStatusInputSchema = z.object({
    response_format: ResponseFormatSchema,
}).strict();
/**
 * Disconnect input schema
 */
export const DisconnectInputSchema = z.object({}).strict();
//# sourceMappingURL=index.js.map