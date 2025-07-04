#!/usr/bin/env node
// bin/carrot-scan.js

import inquirer from 'inquirer';
import open from 'open';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

// percorso a un piccolo “lock file” nella home dell’utente
const lockfile = join(process.env.HOME || process.env.USERPROFILE, '.carrot-scan-ran');

async function main() {
  // … qui va il tuo codice principale …

  // Solo alla PRIMA esecuzione in un terminale interattivo
  if (!existsSync(lockfile) && process.stdout.isTTY && !process.env.CI) {
    const { apri } = await inquirer.prompt([{
      type: 'confirm',
      name: 'Open',
      message: '🎉 Welcome to carrot-scan! Want to open the GitHub repo?',
      default: true
    }]);
    if (apri) {
      await open('https://github.com/SonoTommy/carrot-scan');
    }
    // creiamo il lockfile per non ripetere
    writeFileSync(lockfile, Date.now().toString());
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});