#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { scan } from './scanner.js';
import { listPlugins, enablePlugin, disablePlugin, createPlugin } from './plugin-manager.js';
import { doctor } from './doctor.js';

program
  .name('carrot-scan')
  .version('0.1.0')
  .argument('[target]', 'file or directory to scan', '.')
  .option('-f, --fast', 'run a fast scan (basic checks)')
  .option('-c, --complete', 'run a complete scan (deeper, slower)')
  .option('-d, --default', 'run the default scan (same as no flag)')
  .option('-j, --json', 'output raw JSON (good for CI)')
  .option('-i, --incremental', 'scan only changed files in the last commit')
  .option('-v, --verbose', 'output verbose logs')
  .option('-p, --plugin <name>', 'run only a single plugin')
  .action(async (target, opts) => {
    // pick the first non-undefined flag; default otherwise
    const mode = opts.fast ? 'fast' : opts.complete ? 'complete' : 'default';

    try {
      const result = await scan(target, { 
        mode, 
        incremental: opts.incremental, 
        plugin: opts.plugin 
      });

      if (opts.json) {
        // machine‑readable output
        console.log(JSON.stringify(result, null, 2));
      } else {
        // colourful human output
        const paint =
          result.rating === 'good'
            ? chalk.green
            : result.rating === 'not good'
              ? chalk.yellow
              : chalk.red;

        console.log(paint(`${result.rating.toUpperCase()}  (score: ${result.score}/100)`));
        result.messages.forEach((m) => console.log(`• ${m}`));
      }

      // exit codes: 0 good, 1 not good, 2 bad
      process.exitCode = result.exitCode;
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 3; // unexpected error
    }
  });

program.command('doctor')
  .description('check for potential issues')
  .action(doctor);

const pluginCommand = program.command('plugin')
  .description('manage plugins');

pluginCommand.command('list')
  .description('list all available plugins')
  .action(listPlugins);

pluginCommand.command('enable <plugin-name>')
  .description('enable a plugin')
  .action(enablePlugin);

pluginCommand.command('disable <plugin-name>')
  .description('disable a plugin')
  .action(disablePlugin);

pluginCommand.command('create <plugin-name>')
  .description('create a new plugin from template')
  .action(createPlugin);

program.parse(process.argv);