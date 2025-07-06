import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { execSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';

import { CriticalPlugin } from '../plugins/critical';
import { ESLintPlugin } from '../plugins/eslint';
import { ComplexityPlugin } from '../plugins/complexity';
import { XrayPlugin } from '../plugins/xray';
import { SemgrepPlugin } from '../plugins/semgrep';
import { HeuristicPlugin } from '../plugins/heuristic';
import { AuditPlugin } from '../plugins/audit';
import { DockerfilePlugin } from '../plugins/dockerfile';
import { AiPlugin } from '../plugins/ai';
import { OsvPlugin } from '../plugins/osv';
import { Plugin, PluginResult, Severity, ScanResult } from './plugin-interface';

export { ScanResult };

const plugins: Plugin[] = [
  new CriticalPlugin(),
  new ESLintPlugin(),
  new ComplexityPlugin(),
  new XrayPlugin(),
  new SemgrepPlugin(),
  new HeuristicPlugin(),
  new AuditPlugin(),
  new DockerfilePlugin(),
  new AiPlugin(),
  new OsvPlugin(),
];

const defaultWeights: Record<string, number> = {
  critical: 50,
  eslint: 2,
  complexity: 1,
  xray: 8,
  semgrep: 5,
  heuristic: 3,
  audit: 4,
  dockerfile: 5,
};

const fileCache = new Map<string, string>();
const pluginResultCache = new Map<string, PluginResult[]>();

async function getFileHash(filePath: string): Promise<string> {
  const fileContent = await fs.readFile(filePath);
  return createHash('sha256').update(fileContent).digest('hex');
}

async function safeReadFile(filePath: string): Promise<string | null> {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath)!;
  }
  try {
    const content = await fs.readFile(filePath, 'utf8');
    fileCache.set(filePath, content);
    return content;
  } catch {
    return null;
  }
}

async function discoverFiles(target: string, incremental: boolean): Promise<string[]> {
  const stats = await fs.stat(target);
  if (incremental && stats.isDirectory()) {
    return execSync('git diff --name-only HEAD~1', { cwd: target })
      .toString()
      .split('\n')
      .filter(Boolean)
      .map((f) => path.resolve(target, f));
  }
  return stats.isDirectory()
    ? globby(['**/*'], {
        cwd: target,
        gitignore: true,
        absolute: true,
        onlyFiles: true,
        dot: true,
      })
    : [path.resolve(target)];
}

async function runPlugins(plugins: Plugin[], files: string[], { target, mode }: { target: string; mode: string }): Promise<PluginResult[]> {
  const pluginPromises = plugins.map(async (plugin) => {
    const matchingFiles = files.filter((filePath) => (plugin.constructor as typeof Plugin).applies(filePath));
    if (!matchingFiles.length) return [];

    const pluginResults: PluginResult[] = [];
    for (const filePath of matchingFiles) {
      const fileHash = await getFileHash(filePath);
      const cacheKey = `${(plugin.constructor as typeof Plugin).pluginName}-${fileHash}`;

      if (pluginResultCache.has(cacheKey)) {
        pluginResults.push(...pluginResultCache.get(cacheKey)!);
        continue;
      }

      const content = await safeReadFile(filePath);
      if (!content) continue;
      const results = await plugin.run(filePath, { target, mode, content });
      pluginResultCache.set(cacheKey, results);
      for (const r of results) pluginResults.push(r);
    }
    return pluginResults;
  });

  const allPluginResults = await Promise.all(pluginPromises);
  return allPluginResults.flat();
}

function calculateScore(results: PluginResult[]): { score: number; messages: string[] } {
  let score = 100;
  const messages: string[] = [];
  for (const r of results) {
    const weight = defaultWeights[r.pluginName] ?? 1;
    score -= weight;
    if (r.message) messages.push(r.message);
  }
  return { score: Math.max(0, score), messages };
}

function getRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'bad' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'bad';
}

export async function scan(target: string, options: { mode?: string; incremental?: boolean; stream?: false; plugin?: string }): Promise<ScanResult>;
export function scan(target: string, options: { mode?: string; incremental?: boolean; stream: true; plugin?: string }): Promise<EventEmitter>;
export async function scan(target: string, { mode = 'default', incremental = false, stream = false, plugin }: { mode?: string; incremental?: boolean; stream?: boolean; plugin?: string } = {}): Promise<ScanResult | EventEmitter> {
  const activePlugins = plugin ? plugins.filter(p => (p.constructor as typeof Plugin).pluginName === plugin) : plugins;
  if (plugin && !activePlugins.length) {
    throw new Error(`Plugin not found: ${plugin}`);
  }

  if (stream) {
    const emitter = new EventEmitter();
    process.nextTick(async () => {
      try {
        emitter.emit('start', { target });
        const files = await discoverFiles(target, incremental);
        if (!files.length) {
          emitter.emit('complete', {
            target,
            mode,
            score: 100,
            rating: 'good',
            messages: ['No files to scan'],
            exitCode: 0,
          });
          return;
        }

        const results = await runPlugins(activePlugins, files, { target, mode });
        const criticalCount = results.filter((r) => r.pluginName === 'critical').length;
        if (criticalCount > 0) {
          emitter.emit('complete', {
            target,
            mode,
            score: 0,
            rating: 'bad',
            messages: [`${criticalCount} critical issues`],
            exitCode: 2,
          });
          return;
        }

        const { score, messages } = calculateScore(results);
        const rating = getRating(score);
        emitter.emit('complete', {
          target,
          mode,
          score,
          rating,
          messages,
          exitCode: rating === 'bad' ? 2 : rating === 'poor' ? 1 : 0,
        });
      } catch (err) {
        emitter.emit('error', err);
      }
    });
    return emitter;
  }

  const files = await discoverFiles(target, incremental);
  if (!files.length) {
    return {
      target,
      mode,
      score: 100,
      rating: 'good',
      messages: ['No files to scan'],
      exitCode: 0,
    };
  }

  const results = await runPlugins(activePlugins, files, { target, mode });
  const criticalCount = results.filter((r) => r.pluginName === 'critical').length;
  if (criticalCount > 0) {
    return {
      target,
      mode,
      score: 0,
      rating: 'bad',
      messages: [`${criticalCount} critical issues`],
      exitCode: 2,
    };
  }

  const { score, messages } = calculateScore(results);
  const rating = getRating(score);

  return {
    target,
    mode,
    score,
    rating,
    messages,
    exitCode: rating === 'bad' ? 2 : rating === 'poor' ? 1 : 0,
  };
}