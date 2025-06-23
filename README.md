# carrot-scan

<p align="center">
  <img src="https://raw.githubusercontent.com/SonoTommy/carrot-scan/refs/heads/main/img/logo.svg" width="200" height="179" alt="">
  <br><strong>Command-line tool for detecting vulnerabilities in files and directories.</strong>
  <br><a href="https://github.com/SonoTommy/carrot-scan">GitHub Repository</a>
</p>


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/SonoTommy/carrot-scan/refs/heads/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/SonoTommy/carrot-scan.svg)](https://github.com/SonoTommy/carrot-scan/issues)
[![GitHub stars](https://img.shields.io/github/stars/SonoTommy/carrot-scan.svg?style=social&label=Stars)](https://github.com/SonoTommy/carrot-scan/stargazers)
[![Downloads](https://img.shields.io/npm/dt/carrot-scan.svg)](https://www.npmjs.com/package/carrot-scan)

## Installation

Install carrot-scan globally using npm:

```bash
npm install -g carrot-scan
```

A **fast**, **extensible**, and **plugin-driven** code scanner for JavaScript, TypeScript, and any other file in your project.  
It evaluates code quality, complexity, security vulnerabilities, and more, producing a **single aggregated score** (0–100) and actionable feedback.

## Features

- 🛡️ **Critical patterns**: Immediately fails on destructive or remote‐execution hooks (`rm -rf`, `include()`, `eval()`, etc.).
- 📏 **ESLint integration**: Runs ESLint (v9+) with recommended rules on JS/TS files.
- 🔢 **Cyclomatic complexity**: Uses `typhonjs-escomplex` to penalize high-complexity code.
- 🔍 **AST-based security**: Leverages `@nodesecure/js-x-ray` to detect injection patterns.
- 🌐 **Multi-language rules**: Integrates Semgrep OWASP Top Ten rules for 35+ languages.
- 🔎 **Heuristic scanning**: Regex-based patterns for generic vulnerabilities across all file types.
- 🛠️ **Dependency audit**: Runs `npm audit` and scores known CVEs.
- ⚙️ **Plugin architecture**: Easily add or remove checks by dropping in plugins under `plugins/`.

## Installation

Install globally via npm:

```bash
npm install -g carrot-scan
```

During development:

```bash
git clone https://github.com/SonoTommy/carrot-scan.git
cd carrot-scan
npm install
npm link
```

## Usage

```bash
carrot-scan [options] <target>
```

- `<target>`: File or directory to scan (defaults to current folder).
- `-f, --fast`     : Quick scan (ESLint + heuristics only).
- `-c, --complete` : Full scan (all checks).
- `-j, --json`     : Output machine-readable JSON.

### Examples

```bash
# Fast lint + heuristics on current folder
carrot-scan -f

# Full scan on src/ directory
carrot-scan src/ -c

# JSON output for CI pipelines
carrot-scan . -c --json > report.json
```

## API

Use programmatically:

```js
import { scan } from 'carrot-scan';

(async () => {
  const result = await scan('src/', { mode: 'complete' });
  console.log(result);
})();
```

## Plugin Development

Plugins live in the `plugins/` directory. Each plugin exports:

- `name`: string identifier.
- `scope`: `'js' | 'all'` (files to apply to).
- `applies(file: string)`: boolean.
- `run(files: string[], context)`: `Promise<number>` of issue count.

See existing plugins for examples:
```bash
plugins/
├─ critical.js
├─ eslint.js
├─ complexity.js
├─ xray.js
├─ semgrep.js
├─ heuristic.js
└─ audit.js
```

## Configuration

Create `carrot-scan.config.js` in your project root to override weights, thresholds, or enable/disable plugins:

```js
// carrot-scan.config.js
export default {
  weights: {
    eslint: 1.5,
    xray: 10,
    audit: 5
  },
  thresholds: {
    complexity: 12
  },
  plugins: {
    semgrep: { enabled: false }
  }
};
```

## Contributing

1. Fork the repository.
2. Create your branch (`git checkout -b feature/my-check`).
3. Make changes and add tests.
4. Submit a pull request.

Please follow the existing code style and include unit tests for new plugins.

## ☕ Support my project

If you like carrot-scan and want to support its development, you can buy me a coffee:

☕ (https://ko-fi.com/SonoTommy)


## License

© 2025 Tommaso “Tommy” [MIT License](LICENSE)
