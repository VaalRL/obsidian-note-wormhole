/**
 * Chrome DevTools Protocol Client
 * Handles connection to Obsidian via CDP
 */

import CDP from 'chrome-remote-interface';
import type { CDPConfig } from './types.js';

export class CDPClient {
  private config: CDPConfig;
  private client: CDP.Client | null = null;
  private targetId: string | null = null;

  constructor(config: CDPConfig = { host: 'localhost', port: 9222 }) {
    this.config = config;
  }

  /**
   * List all available Chrome targets
   */
  async listTargets(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    url: string;
    description?: string;
  }>> {
    try {
      const targets = await CDP.List({
        host: this.config.host,
        port: this.config.port,
      });

      return targets.map((target: any) => ({
        id: target.id,
        type: target.type,
        title: target.title,
        url: target.url,
        description: target.description,
      }));
    } catch (error) {
      throw new Error(`Failed to list targets: ${error}`);
    }
  }

  /**
   * Connect to a specific target
   */
  async connect(targetId?: string): Promise<void> {
    try {
      // If no targetId provided, try to find an app:// target (Electron)
      if (!targetId) {
        const targets = await this.listTargets();
        const electronTarget = targets.find(
          t => t.type === 'page' && (t.url.startsWith('app://') || t.title.includes('Obsidian'))
        );

        if (!electronTarget) {
          throw new Error('No Obsidian target found. Make sure Obsidian is running with --remote-debugging-port=9222');
        }

        targetId = electronTarget.id;
      }

      this.client = await CDP({
        host: this.config.host,
        port: this.config.port,
        target: targetId,
      });

      this.targetId = targetId;

      // Enable necessary domains
      await this.client.Runtime.enable();
      await this.client.Network.enable();
      await this.client.Console.enable();

    } catch (error) {
      throw new Error(`Failed to connect to target: ${error}`);
    }
  }

  /**
   * Disconnect from current target
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.targetId = null;
    }
  }

  /**
   * Get the current CDP client
   */
  getClient(): CDP.Client {
    if (!this.client) {
      throw new Error('Not connected to any target');
    }
    return this.client;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client !== null;
  }

  /**
   * Get current target ID
   */
  getTargetId(): string | null {
    return this.targetId;
  }

  /**
   * Execute JavaScript in the context
   */
  async evaluate(expression: string): Promise<any> {
    if (!this.client) {
      throw new Error('Not connected');
    }

    const result = await this.client.Runtime.evaluate({
      expression,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw new Error(`Evaluation failed: ${result.exceptionDetails.text}`);
    }

    return result.result.value;
  }
}
