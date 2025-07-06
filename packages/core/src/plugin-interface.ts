// src/plugin-interface.ts

/**
 * @typedef {'info'|'warning'|'error'} Severity
 */
export type Severity = 'info' | 'warning' | 'error';

/**
 * @typedef {Object} PluginResult
 * @property {string} pluginName - The name of the plugin
 * @property {string} filePath   - Path to the file analyzed
 * @property {number} line       - Line number where the issue was found
 * @property {number} column     - Column number where the issue was found
 * @property {Severity} severity - Issue severity level
 * @property {string} message    - Human-readable description
 * @property {string} [ruleId]   - Optional rule or identifier
 */
export interface PluginResult {
  pluginName: string;
  filePath: string;
  line: number;
  column: number;
  severity: Severity;
  message: string;
  ruleId?: string;
}

/**
 * @typedef {Object} ScanResult
 * @property {string} target
 * @property {string} mode
 * @property {number} score
 * @property {'excellent' | 'good' | 'fair' | 'poor' | 'bad'} rating
 * @property {string[]} messages
 * @property {number} exitCode
 */
export interface ScanResult {
  target: string;
  mode: string;
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  messages: string[];
  exitCode: number;
}

/**
 * Base class for all plugins.
 */
export class Plugin {
  /**
   * Unique name for the plugin
   * @type {string}
   */
  static pluginName: string = 'base-plugin';

  /**
   * Determines if this plugin applies to a given file extension
   * @param {string} filePath
   * @returns {boolean}
   */
  static applies(filePath: string): boolean {
    return false;
  }

  /**
   * Execute the plugin against the file contents.
   * @param {string} filePath
   * @param {object} context
   * @param {string} context.content
   * @param {string} context.target
   * @param {string} context.mode
   * @returns {Promise<PluginResult[]>}
   */
  async run(filePath: string, context: { content: string; target: string; mode: string }): Promise<PluginResult[]> {
    return [];
  }
}

/**
 * Example plugin template:
 *
 * import { Plugin } from './plugin-interface.js';
 *
 * export class ExamplePlugin extends Plugin {
 *   static pluginName = 'example';
 *
 *   static applies(filePath) {
 *     return filePath.endsWith('.js');
 *   }
 *
 *   async run(filePath, { content }) {
 *     const results = [];
 *     // ... analyze content, push PluginResult objects
 *     return results;
 *   }
 * }
 */