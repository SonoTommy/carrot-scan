
import { exec } from 'child_process';
import chalk from 'chalk';

export async function outdated() {
  console.log(chalk.cyan('Checking for outdated dependencies...'));

  exec('npm outdated', (err, stdout, stderr) => {
    if (err && err.code !== 1) {
      console.error(chalk.red(`Error checking for outdated dependencies: ${err.message}`));
      return;
    }

    if (stdout) {
      console.log(chalk.yellow('Outdated dependencies:'));
      console.log(stdout);
    } else {
      console.log(chalk.green('All dependencies are up-to-date.'));
    }
  });
}
