#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { scan } from './scanner.js';

program
  .name('carrot-scan')
  .version('0.1.0')
  .argument('<target>', 'file or directory to scan')
  .option('-f, --fast', 'run a fast scan (basic checks)')
  .option('-c, --complete', 'run a complete scan (deeper, slower)')
  .option('-d, --default', 'run the default scan (same as no flag)')
  .action(async (target, opts) => {
    // pick the first non-undefined flag; default otherwise
    const mode = opts.fast ? 'fast' : opts.complete ? 'complete' : 'default';

    try {
      const result = await scan(target, { mode });

      const paint =
        result.rating === 'good'      ? chalk.green :
        result.rating === 'not good'  ? chalk.yellow :
                                        chalk.red;

      console.log(paint(`${result.rating.toUpperCase()}  (score: ${result.score}/100)`));

      result.messages.forEach(m => console.log(`• ${m}`));

      // exit codes: 0 good, 1 not good, 2 bad
      process.exitCode = result.exitCode;
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 3;           // unexpected error
    }
  });

program.parse(process.argv);
