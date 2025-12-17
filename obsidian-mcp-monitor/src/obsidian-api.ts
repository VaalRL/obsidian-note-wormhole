/**
 * Obsidian REST API Client
 * Interacts with Obsidian via the Local REST API plugin
 */

import axios, { AxiosInstance } from 'axios';
import type { ObsidianAPIConfig, ObsidianFile } from './types.js';

export class ObsidianAPI {
  private config: ObsidianAPIConfig;
  private client: AxiosInstance;

  constructor(config: ObsidianAPIConfig = { baseUrl: 'http://localhost:27123' }) {
    this.config = config;

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: this.config.apiKey
        ? { Authorization: `Bearer ${this.config.apiKey}` }
        : {},
    });
  }

  /**
   * Check if the API is available
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all files in vault
   */
  async listFiles(): Promise<string[]> {
    try {
      const response = await this.client.get('/vault/');
      return response.data.files || [];
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  /**
   * Read a file from vault
   */
  async readFile(path: string): Promise<ObsidianFile> {
    try {
      const response = await this.client.get(`/vault/${encodeURIComponent(path)}`);
      const content = response.data;

      // Parse frontmatter if exists
      const frontmatter = this.parseFrontmatter(content);
      const tags = this.extractTags(content);

      return {
        path,
        content,
        frontmatter,
        tags,
      };
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  /**
   * Write/update a file in vault
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      await this.client.put(`/vault/${encodeURIComponent(path)}`, content, {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  }

  /**
   * Append content to a file
   */
  async appendToFile(path: string, content: string): Promise<void> {
    try {
      await this.client.post(`/vault/${encodeURIComponent(path)}`, content, {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    } catch (error) {
      throw new Error(`Failed to append to file ${path}: ${error}`);
    }
  }

  /**
   * Delete a file from vault
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await this.client.delete(`/vault/${encodeURIComponent(path)}`);
    } catch (error) {
      throw new Error(`Failed to delete file ${path}: ${error}`);
    }
  }

  /**
   * Search files in vault
   */
  async search(query: string): Promise<Array<{ path: string; matches: string[] }>> {
    try {
      const response = await this.client.post('/search/', { query });
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to search: ${error}`);
    }
  }

  /**
   * Get active file
   */
  async getActiveFile(): Promise<string | null> {
    try {
      const response = await this.client.get('/active/');
      return response.data?.path || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Open a file in Obsidian
   */
  async openFile(path: string): Promise<void> {
    try {
      await this.client.post('/open/', { file: path });
    } catch (error) {
      throw new Error(`Failed to open file ${path}: ${error}`);
    }
  }

  /**
   * Parse YAML frontmatter from content
   */
  private parseFrontmatter(content: string): Record<string, any> | undefined {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return undefined;
    }

    try {
      const yaml = match[1];
      const lines = yaml.split('\n');
      const result: Record<string, any> = {};

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tagRegex = /#[\w-]+/g;
    const matches = content.match(tagRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Format file list as markdown
   */
  formatFilesAsMarkdown(files: string[]): string {
    if (files.length === 0) {
      return 'No files found in vault.';
    }

    let markdown = `# Vault Files (${files.length} files)\n\n`;

    // Group by directory
    const grouped: Record<string, string[]> = {};

    for (const file of files) {
      const parts = file.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';

      if (!grouped[dir]) {
        grouped[dir] = [];
      }
      grouped[dir].push(file);
    }

    // Sort directories
    const sortedDirs = Object.keys(grouped).sort();

    for (const dir of sortedDirs) {
      markdown += `## ${dir}\n\n`;
      for (const file of grouped[dir].sort()) {
        const fileName = file.split('/').pop();
        markdown += `- ${fileName}\n`;
      }
      markdown += '\n';
    }

    return markdown;
  }
}
