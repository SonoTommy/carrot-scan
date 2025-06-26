// index.d.ts

/**
 * One result from a single plugin.
 */
export interface PluginResult {
  /** How many issues this plugin found */
  count: number;
  /** A list of human-readable details per issue */
  details: string[];
}

/**
 * A single issue found by any plugin.
 */
export interface Issue {
  file: string;
  line: number;
  message: string;
  plugin: string;
}

/**
 * The full result of running `scan()`.
 * @param target  Path or glob(s) to scan
 * @param options.mode  `'fast' | 'complete'`
 * @param options.json  If `true`, just give me raw JSON
 */
export function scan(
  target: string | string[],
  options?: { mode?: 'fast' | 'complete'; json?: boolean }
): Promise<ScanResult>;

export interface ScanResult {
  overallScore: number;
  pluginResults: Record<string, PluginResult>;
  issues: Issue[];
  durationMs: number;
}
