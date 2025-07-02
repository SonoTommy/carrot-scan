// src/plugin-interface.js


/**
 * @typedef {'info'|'warning'|'error'} Severity
 *
 * @typedef {Object} PluginResult
 * @property {string} pluginName - The name of the plugin
 * @property {string} filePath   - Path to the file analyzed
 * @property {number} line       - Line number where the issue was found
 * @property {number} column     - Column number where the issue was found
 * @property {Severity} severity - Issue severity level
 * @property {string} message    - Human-readable description
 * @property {string} [ruleId]   - Optional rule or identifier
 */

/**
 * Base class for all plugins.
 */
export class Plugin {
  /**
   * Unique name for the plugin
   * @type {string}
   */
  static pluginName = 'base-plugin';

  /**
   * Determines if this plugin applies to a given file extension
   * @param {string} filePath
   * @returns {boolean}
   */
  static applies(filePath) {
    return false;
  }

  /**
   * Execute the plugin against the file contents.
   * @param {string} filePath
   * @param {string} content
   * @returns {Promise<PluginResult[]>}
   */
  async run(filePath, { content }) {
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
