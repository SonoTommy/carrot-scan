
import chalk from 'chalk';
import { exec } from 'child_process';

async function checkDependency(name) {
  return new Promise((resolve) => {
    exec(`npm list ${name}`, (err, stdout) => {
      if (err || !stdout.includes(name)) {
        resolve({ name, installed: false });
      } else {
        resolve({ name, installed: true });
      }
    });
  });
}

export async function doctor() {
  console.log(chalk.cyan('Running checks...'));

  const dependencies = [
    'eslint',
    'semgrep',
    '@nodesecure/js-x-ray',
    'typhonjs-escomplex'
  ];

  const results = await Promise.all(dependencies.map(checkDependency));
  const missing = results.filter(res => !res.installed);

  if (missing.length > 0) {
    console.log(chalk.yellow('Some recommended dependencies are missing:'));
    missing.forEach(dep => console.log(`- ${dep.name}`));
    console.log(chalk.cyan('Install them with: npm install'));
  } else {
    console.log(chalk.green('All good!'));
  }
}
