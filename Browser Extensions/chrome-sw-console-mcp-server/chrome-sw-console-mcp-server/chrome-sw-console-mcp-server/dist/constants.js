/**
 * Constants for Chrome Service Worker Console MCP Server
 */
// Character limit for markdown responses to prevent context overflow
export const CHARACTER_LIMIT = 100000;
// Default Chrome DevTools connection settings
export const DEFAULT_CHROME_HOST = "localhost";
export const DEFAULT_CHROME_PORT = 9222;
export const DEFAULT_SECURE = false;
// Default pagination settings
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;
// Console message retention time (in milliseconds)
export const MESSAGE_RETENTION_TIME = 60 * 60 * 1000; // 1 hour
// Connection timeout (in milliseconds)
export const CONNECTION_TIMEOUT = 5000;
// Polling interval for service worker detection (in milliseconds)
export const SW_DETECTION_INTERVAL = 2000;
//# sourceMappingURL=constants.js.map