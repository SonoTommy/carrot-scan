````markdown
<p align="center">
  <img src="https://raw.githubusercontent.com/SonoTommy/carrot-scan/refs/heads/main/img/logo.svg" width="200" height="179" alt="Carrot Scan logo">
  <br><strong>Command‑line tool for detecting vulnerabilities and code quality issues.</strong>
  <br><a href="https://github.com/SonoTommy/carrot-scan">GitHub Repository</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/SonoTommy/carrot-scan/refs/heads/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/SonoTommy/carrot-scan.svg)](https://github.com/SonoTommy/carrot-scan/issues)
[![GitHub stars](https://img.shields.io/github/stars/SonoTommy/carrot-scan.svg?style=social&label=Stars)](https://github.com/SonoTommy/carrot-scan/stargazers)
[![Downloads](https://img.shields.io/npm/dt/carrot-scan.svg)](https://www.npmjs.com/package/carrot-scan)

## Features

- 🛡️ **Critical Pattern Detection**: Fails immediately on dangerous operations (`rm -rf`, `eval()`, dynamic `include()`, etc.).
- 📏 **ESLint Integration**: Runs ESLint v9+ with recommended rules for JS/TS.
- 🔢 **Cyclomatic Complexity**: Penalizes high-complexity code with `typhonjs-escomplex`.
- 🔍 **AST‑based Security**: Uses `@nodesecure/js-x-ray` to find injection patterns.
- 🌐 **OWASP Semgrep Rules**: Supports OWASP Top Ten checks across 35+ languages.
- 🔎 **Heuristic Scanning**: Regex patterns for generic vulnerabilities in any file.
- 🛠️ **Dependency Audit**: Aggregates `npm audit` CVE data into your score.
- ⚙️ **Plugin‑driven**: Drop custom checks into `plugins/` without touching core code.

## Installation

Install globally via npm:

```bash
npm install -g carrot-scan
````

Or clone for development:

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

* `<target>`: File or directory to scan (defaults to `.`).
* `-f, --fast`     : Quick scan (ESLint + heuristics).
* `-c, --complete` : Comprehensive scan (all plugins).
* `-j, --json`     : Output JSON for CI pipelines.

### Examples

```bash
# Fast lint + heuristics on current folder
carrot-scan -f

# Full scan on src/ directory
carrot-scan src/ -c

# JSON report for CI
carrot-scan . -c --json > report.json
```

## API

```js
import { scan } from 'carrot-scan';

(async () => {
  const result = await scan('src/', { mode: 'complete' });
  console.log(result);
})();
```

## Plugin Development

Create a file under `plugins/` exporting:

```js
export default {
  name: 'myPlugin',       // Unique identifier
  scope: 'js' | 'all',     // File types
  applies(file) { ... },   // Boolean filter
  async run(files, ctx) {  // Return issue count
    return 0;
  }
};
```

Check existing plugins (`critical.js`, `eslint.js`, `complexity.js`, `xray.js`, `semgrep.js`, `heuristic.js`, `audit.js`) for guidance.

## Configuration

Customize scanning via `carrot-scan.config.js` in project root:

```js
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

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-check`)
3. Add your changes and tests
4. Open a Pull Request

Follow existing code style and include unit tests for new functionality.

## Support

If you find **carrot-scan** useful, consider buying me a coffee:

☕ [ko-fi.com/SonoTommy](https://ko-fi.com/SonoTommy)

---

© 2025 Tommaso “Tommy”  |  [MIT License](LICENSE)

```
```

