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

A **fast**, **extensible**, and **plugin-driven** code scanner for JavaScript, TypeScript, and any other file in your project.  
It evaluates code quality, complexity, security vulnerabilities, and more, producing a **single aggregated score** (0–100) and actionable feedback.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Plugin Management](#plugin-management)
- [API](#api)
- [Plugin Development](#plugin-development)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Features

- 🛡️ **Critical patterns**: Immediately fails on destructive or remote‐execution hooks (`rm -rf`, `include()`, `eval()`, etc.).
- 📏 **ESLint integration**: Runs ESLint (v9+) with recommended rules on JS/TS files.
- 🔢 **Cyclomatic complexity**: Uses `typhonjs-escomplex` to penalize high-complexity code.
- 🔍 **AST-based security**: Leverages `@nodesecure/js-x-ray` to detect injection patterns.
- 🌐 **Multi-language rules**: Integrates Semgrep OWASP Top Ten rules for 35+ languages.
- 🔎 **Heuristic scanning**: Regex-based patterns for generic vulnerabilities across all file types.
- 🛠️ **Dependency audit**: Runs `npm audit` and scores known CVEs.
- ⚙️ **Plugin architecture**: Easily add or remove checks by dropping in plugins under `plugins/`.
- 🐳 **Dockerfile scanning**: Checks for common misconfigurations in `Dockerfile`.

## Recent Improvements

-   **Enhanced CLI**: Added a new `outdated` command to check for outdated dependencies.
-   **New Plugin**: Added a new `dockerfile` plugin to check for common misconfigurations in `Dockerfile`.
-   **Performance Boost**: Parallelized plugin execution and implemented file content caching to improve performance.
-   **CI/CD Pipeline**: Implemented a GitHub Actions workflow to automatically test and lint the code.
-   **Code Refactoring**: Refactored the code for better maintainability and readability.

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
- `-f, --fast` : Quick scan (ESLint + heuristics only).
- `-c, --complete` : Full scan (all checks).
- `-j, --json` : Output machine-readable JSON.
- `-v, --version` : Show the installed version of carrot-scan.
- `--verbose`: Output detailed logs during scanning.

### Examples

```bash
# Fast lint + heuristics on current folder
carrot-scan -f

# Full scan on src/ directory
carrot-scan src/ -c

# JSON output for CI pipelines
carrot-scan . -c --json > report.json
```

### Supply-Chain (SBOM) Generation

Generate a Software Bill of Materials (SBOM) with embedded vulnerability information from the OSV public API. Supports CycloneDX XML and SARIF formats.

```bash
# Generate CycloneDX SBOM for the current directory (default)
carrot-scan sbom .

# Generate SARIF output instead of XML
carrot-scan sbom . --sarif
```

### Doctor Command

Check for potential issues with your `carrot-scan` setup.

```bash
carrot-scan doctor
```

### Outdated Command

Check for outdated dependencies.

```bash
carrot-scan outdated
```

## Plugin Management

`carrot-scan` provides commands to manage its plugins:

- `list`: List all available plugins.
- `enable <plugin-name>`: Enable a plugin.
- `disable <plugin-name>`: Disable a plugin.
- `create <plugin-name>`: Create a new plugin from a template.

## API

### Programmatic Usage

Use `carrot-scan` programmatically in your own projects.

```js
import { scan } from 'carrot-scan';

(async () => {
  const result = await scan('src/', { mode: 'complete' });
  console.log(result);
})();
```

### REST API

The REST API allows you to run scans via HTTP.

- **POST /scan**: Run a scan.
  - **Body**: `{ "target": "./src", "mode": "fast" }`
- **GET /scan/stream**: Get real-time scan results using Server-Sent Events.
  - **Query Params**: `target`, `mode`

For more details, see the [OpenAPI specification](.github/openapi.yaml).

## Plugin Development

Plugins are the core of `carrot-scan`. To create a new plugin, run:

```bash
carrot-scan plugin create my-plugin
```

This will generate a new plugin file in the `plugins/` directory. A plugin is a class that extends `Plugin` and implements two methods:

- `applies(file: string)`: A static method that returns `true` if the plugin should be run on the given file.
- `run(file: string, context: object)`: An async method that performs the scan and returns an array of issues.

See the existing plugins for examples.

## Configuration

Create a `carrot-scan.config.js` file in your project root to customize `carrot-scan`.

```js
// carrot-scan.config.js
export default {
  weights: {
    eslint: 1.5,
    xray: 10,
  },
  thresholds: {
    complexity: 12,
  },
  plugins: {
    semgrep: { enabled: false },
  },
};
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### Development

To get started with development:

1.  Clone the repository:
    ```bash
    git clone https://github.com/SonoTommy/carrot-scan.git
    ```
2.  Install dependencies:
    ```bash
    cd carrot-scan
    npm install
    ```
3.  Link the package to use the `carrot-scan` command globally:
    ```bash
    npm link
    ```

### Pull Requests

When submitting a pull request, please make sure to:

-   Follow the existing code style.
-   Add tests for your changes.
-   Update the documentation if necessary.
-   Run `npm test` and `npm run lint` before submitting.

## Support

If you find `carrot-scan` useful, please consider [supporting the project](https://ko-fi.com/sonotommy).

## License

[MIT](LICENSE)

