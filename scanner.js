import path from 'path';
import { fileURLToPath } from 'url';
import { globby } from 'globby';

/**
 * Core scanning function
 * @param {string} target - File or directory to scan
 * @param {Object} options
 * @param {'fast'|'complete'|'default'} [options.mode]
 * @param {boolean} [options.incremental] - If true, only scan changed files
 * @param {string} [options.plugin] - Single plugin to run
 * @returns {Promise<Object>} Scan results including rating, score, messages, exitCode
 */
export async function scan(target = '.', options = {}) {
  const cwd = typeof target === 'string' ? path.resolve(process.cwd(), target) : process.cwd();
  const patterns = ['**/*.{js,jsx,ts,tsx}'];
  const incremental = options.incremental || false;

  // Resolve plugin directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pluginDir = path.resolve(__dirname, 'plugins');

  // Determine plugins to load
  const allFiles = await globby('*.js', { cwd: pluginDir });
  const available = allFiles.map(f => path.basename(f, '.js'));
  const pluginNames = options.plugin
    ? available.includes(options.plugin) ? [options.plugin] : []
    : available;

  // Load plugins
  const plugins = await Promise.all(
    pluginNames.map(async name => {
      const mod = await import(path.resolve(pluginDir, `${name}.js`));
      const run = mod.default || mod.run;
      if (typeof run !== 'function') throw new Error(`Plugin ${name} has no run()`);
      return { name, run };
    })
  );

  // Discover files to scan
  let files = await globby(patterns, { cwd, gitignore: true, ignore: ['node_modules'] });
  if (incremental) {
    const { execSync } = await import('child_process');
    const diff = execSync('git diff --name-only', { cwd }).toString().split(/\r?\n/);
    files = files.filter(f => diff.includes(f));
  }

  // Run plugins
  const results = [];
  for (const rel of files) {
    const full = path.resolve(cwd, rel);
    for (const { name, run } of plugins) {
      try {
        const data = await run(full, options);
        if (data) results.push({ plugin: name, file: full, data });
      } catch (e) {
        results.push({ plugin: name, file: full, error: e.message });
      }
    }
  }

  // Build messages
  const messages = results.map(r => {
    const file = path.relative(cwd, r.file);
    if (r.error) return `${r.plugin}: error scanning ${file} — ${r.error}`;
    return `${r.plugin}: issue found in ${file}`;
  });

  // Score: 100 minus number of issues (min 0)
  const totalIssues = results.length;
  const score = Math.max(0, 100 - totalIssues);

  // Rating thresholds
  let rating;
  if (score >= 80) rating = 'good';
  else if (score >= 50) rating = 'not good';
  else rating = 'bad';

  const exitCode = rating === 'good' ? 0 : rating === 'not good' ? 1 : 2;

  return { rating, score, messages, exitCode, summary: results };
}

export default scan;
