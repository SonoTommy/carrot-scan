import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { execSync } from 'node:child_process';
import { EventEmitter } from 'node:events';

import { CriticalPlugin } from './plugins/critical.js';
import { ESLintPlugin } from './plugins/eslint.js';
import { ComplexityPlugin } from './plugins/complexity.js';
import { XrayPlugin } from './plugins/xray.js';
import { SemgrepPlugin } from './plugins/semgrep.js';
import { HeuristicPlugin } from './plugins/heuristic.js';
import { AuditPlugin } from './plugins/audit.js';

const plugins = [
  new CriticalPlugin(),
  new ESLintPlugin(),
  new ComplexityPlugin(),
  new XrayPlugin(),
  new SemgrepPlugin(),
  new HeuristicPlugin(),
  new AuditPlugin(),
];

const defaultWeights = {
  critical: 50,
  eslint: 2,
  complexity: 1,
  xray: 8,
  semgrep: 5,
  heuristic: 3,
  audit: 4,
};

/**
 * Scan entrypoint
 * @param {string} target - file or directory
 * @param {{mode?: string, incremental?: boolean, stream?: boolean}} opts
 */
export async function scan(target, { mode = 'default', incremental = false, stream = false, plugin = null } = {}) {
  const activePlugins = plugin ? plugins.filter(p => p.constructor.pluginName === plugin) : plugins;
  if (plugin && !activePlugins.length) {
    throw new Error(`Plugin not found: ${plugin}`);
  }

  if (stream) {
    const emitter = new EventEmitter();
    process.nextTick(async () => {
      try {
        emitter.emit('start', { target });
        // fallback to the non-stream code below, but emit per-plugin events
        // 1. File discovery
        const stats = await fs.stat(target);
        let allFiles;
        if (incremental && stats.isDirectory()) {
          const changed = execSync('git diff --name-only HEAD~1', { cwd: target })
            .toString()
            .split('\n')
            .filter(Boolean)
            .map((f) => path.resolve(target, f));
          allFiles = changed;
        } else {
          allFiles = stats.isDirectory()
            ? await globby(['**/*'], {
                cwd: target,
                gitignore: true,
                absolute: true,
                onlyFiles: true,
                dot: true,
              })
            : [path.resolve(target)];
        }
        if (!allFiles.length) {
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
        // 2. Plugin results collection with streaming emits
        const pluginResults = [];
        for (const plugin of activePlugins) {
          const matchingFiles = allFiles.filter((filePath) => plugin.constructor.applies(filePath));
          if (!matchingFiles.length) continue;
          for (const filePath of matchingFiles) {
            const content = await safeReadFile(filePath);
            if (!content) continue;
            const results = await plugin.run(filePath, { target, mode, content });
            for (const r of results) {
              pluginResults.push(r);
              emitter.emit('pluginResult', r);
            }
          }
          if (plugin.constructor.pluginName === 'critical') {
            const criticalCount = pluginResults.filter((r) => r.pluginName === 'critical').length;
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
          }
        }
        // 3. Scoring
        let score = 100;
        const messages = [];
        for (const r of pluginResults) {
          const weight = defaultWeights[r.pluginName] ?? 1;
          score -= weight;
          if (r.message) messages.push(r.message);
        }
        score = Math.max(0, score);
        // 4. Rating
        const rating =
          score >= 90
            ? 'excellent'
            : score >= 75
              ? 'good'
              : score >= 50
                ? 'fair'
                : score >= 25
                  ? 'poor'
                  : 'bad';
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

  // 1. File discovery
  const stats = await fs.stat(target);
  // If incremental mode, only include files changed in the last commit
  let allFiles;
  if (incremental && stats.isDirectory()) {
    const changed = execSync('git diff --name-only HEAD~1', { cwd: target })
      .toString()
      .split('\n')
      .filter(Boolean)
      .map((f) => path.resolve(target, f));
    allFiles = changed;
  } else {
    allFiles = stats.isDirectory()
      ? await globby(['**/*'], {
          cwd: target,
          gitignore: true,
          absolute: true,
          onlyFiles: true,
          dot: true,
        })
      : [path.resolve(target)];
  }

  if (!allFiles.length) {
    return {
      target,
      mode,
      score: 100,
      rating: 'good',
      messages: ['No files to scan'],
      exitCode: 0,
    };
  }

  // 2. Plugin results collection
  const pluginResults = [];
  for (const plugin of activePlugins) {
    const matchingFiles = allFiles.filter((filePath) => plugin.constructor.applies(filePath));
    if (!matchingFiles.length) continue;

    for (const filePath of matchingFiles) {
      const content = await safeReadFile(filePath);
      if (!content) continue;
      const results = await plugin.run(filePath, { target, mode, content });
      for (const r of results) pluginResults.push(r);
    }

    if (plugin.constructor.pluginName === 'critical') {
      const criticalCount = pluginResults.filter((r) => r.pluginName === 'critical').length;
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
    }
  }

  // 3. Scoring
  let score = 100;
  const messages = [];
  for (const r of pluginResults) {
    const weight = defaultWeights[r.pluginName] ?? 1;
    score -= weight;
    if (r.message) messages.push(r.message);
  }
  score = Math.max(0, score);

  // 4. Rating
  const rating =
    score >= 90
      ? 'excellent'
      : score >= 75
        ? 'good'
        : score >= 50
          ? 'fair'
          : score >= 25
            ? 'poor'
            : 'bad';

  return {
    target,
    mode,
    score,
    rating,
    messages,
    exitCode: rating === 'bad' ? 2 : rating === 'poor' ? 1 : 0,
  };
}

/**
 * Safely read a file, returning null if it fails.
 * @param {string} filePath
 * @returns {Promise<string|null>}
 */
async function safeReadFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}
