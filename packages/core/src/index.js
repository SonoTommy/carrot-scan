import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { execSync } from 'node:child_process';
import { EventEmitter } from 'node:events';

import { CriticalPlugin } from '../plugins/critical.js';
import { ESLintPlugin } from '../plugins/eslint.js';
import { ComplexityPlugin } from '../plugins/complexity.js';
import { XrayPlugin } from '../plugins/xray.js';
import { SemgrepPlugin } from '../plugins/semgrep.js';
import { HeuristicPlugin } from '../plugins/heuristic.js';
import { AuditPlugin } from '../plugins/audit.js';
import { DockerfilePlugin } from '../plugins/dockerfile.js';

const plugins = [
  new CriticalPlugin(),
  new ESLintPlugin(),
  new ComplexityPlugin(),
  new XrayPlugin(),
  new SemgrepPlugin(),
  new HeuristicPlugin(),
  new AuditPlugin(),
  new DockerfilePlugin(),
];

const defaultWeights = {
  critical: 50,
  eslint: 2,
  complexity: 1,
  xray: 8,
  semgrep: 5,
  heuristic: 3,
  audit: 4,
  dockerfile: 5,
};

const fileCache = new Map();

async function safeReadFile(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }
  try {
    const content = await fs.readFile(filePath, 'utf8');
    fileCache.set(filePath, content);
    return content;
  } catch {
    return null;
  }
}

async function discoverFiles(target, incremental) {
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

async function runPlugins(plugins, files, { target, mode }) {
  const pluginPromises = plugins.map(async (plugin) => {
    const matchingFiles = files.filter((filePath) => plugin.constructor.applies(filePath));
    if (!matchingFiles.length) return [];

    const pluginResults = [];
    for (const filePath of matchingFiles) {
      const content = await safeReadFile(filePath);
      if (!content) continue;
      const results = await plugin.run(filePath, { target, mode, content });
      for (const r of results) pluginResults.push(r);
    }
    return pluginResults;
  });

  const allPluginResults = await Promise.all(pluginPromises);
  return allPluginResults.flat();
}

function calculateScore(results) {
  let score = 100;
  const messages = [];
  for (const r of results) {
    const weight = defaultWeights[r.pluginName] ?? 1;
    score -= weight;
    if (r.message) messages.push(r.message);
  }
  return { score: Math.max(0, score), messages };
}

function getRating(score) {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'bad';
}

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