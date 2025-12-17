/**
 * Zod validation schemas for MCP tool inputs
 */
import { z } from "zod";
/**
 * Response format enum
 */
export declare const ResponseFormatSchema: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
/**
 * Console message level enum
 */
export declare const LogLevelSchema: z.ZodOptional<z.ZodEnum<["log", "info", "warn", "error", "debug"]>>;
/**
 * List targets input schema
 */
export declare const ListTargetsInputSchema: z.ZodObject<{
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
    chrome_host: z.ZodDefault<z.ZodString>;
    chrome_port: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
    chrome_host: string;
    chrome_port: number;
}, {
    response_format?: "markdown" | "json" | undefined;
    chrome_host?: string | undefined;
    chrome_port?: number | undefined;
}>;
export type ListTargetsInput = z.infer<typeof ListTargetsInputSchema>;
/**
 * Connect to target input schema
 */
export declare const ConnectToTargetInputSchema: z.ZodObject<{
    target_id: z.ZodString;
    chrome_host: z.ZodDefault<z.ZodString>;
    chrome_port: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    chrome_host: string;
    chrome_port: number;
    target_id: string;
}, {
    target_id: string;
    chrome_host?: string | undefined;
    chrome_port?: number | undefined;
}>;
export type ConnectToTargetInput = z.infer<typeof ConnectToTargetInputSchema>;
/**
 * Start monitoring input schema
 */
export declare const StartMonitoringInputSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export type StartMonitoringInput = z.infer<typeof StartMonitoringInputSchema>;
/**
 * Stop monitoring input schema
 */
export declare const StopMonitoringInputSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export type StopMonitoringInput = z.infer<typeof StopMonitoringInputSchema>;
/**
 * Get console logs input schema
 */
export declare const GetConsoleLogsInputSchema: z.ZodObject<{
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    level: z.ZodOptional<z.ZodEnum<["log", "info", "warn", "error", "debug"]>>;
    start_time: z.ZodOptional<z.ZodNumber>;
    end_time: z.ZodOptional<z.ZodNumber>;
    text_contains: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
    limit: number;
    level?: "log" | "info" | "warn" | "error" | "debug" | undefined;
    start_time?: number | undefined;
    end_time?: number | undefined;
    text_contains?: string | undefined;
}, {
    level?: "log" | "info" | "warn" | "error" | "debug" | undefined;
    response_format?: "markdown" | "json" | undefined;
    limit?: number | undefined;
    start_time?: number | undefined;
    end_time?: number | undefined;
    text_contains?: string | undefined;
}>;
export type GetConsoleLogsInput = z.infer<typeof GetConsoleLogsInputSchema>;
/**
 * Clear logs input schema
 */
export declare const ClearLogsInputSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export type ClearLogsInput = z.infer<typeof ClearLogsInputSchema>;
/**
 * Get status input schema
 */
export declare const GetStatusInputSchema: z.ZodObject<{
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
}, {
    response_format?: "markdown" | "json" | undefined;
}>;
export type GetStatusInput = z.infer<typeof GetStatusInputSchema>;
/**
 * Disconnect input schema
 */
export declare const DisconnectInputSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export type DisconnectInput = z.infer<typeof DisconnectInputSchema>;
//# sourceMappingURL=index.d.ts.map