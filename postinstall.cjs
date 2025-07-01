#!/usr/bin/env node
const https = require('https');
const { exec } = require('child_process');
const repoUrl = 'https://github.com/SonoTommy/carrot-scan';

// 1) Messaggio per utenti reali
const isInteractive = process.stdout.isTTY && !process.env.CI && process.env.NODE_ENV !== 'test';
if (isInteractive) {
  console.log('\n📣 Thanks for having installed carrot-scan!');
  console.log('⭐ If you liked but an star: ' + repoUrl + '\n');
  // Attempt to open the repository page in the default browser
  try {
    const cmd = process.platform === 'darwin'
      ? `open "${repoUrl}"`
      : process.platform === 'win32'
        ? `start "" "${repoUrl}"`
        : `xdg-open "${repoUrl}"`;
    exec(cmd);
  } catch (_) {
    // Non‑fatal: ignore failures (e.g. CI or headless environments)
  }
}

// 2) “Ping” silenzioso per registrare la view (anche da bot)
//    Usiamo una semplice GET alla root del repo: GitHub lo conta come visita nelle statistiche.
const options = {
  method: 'HEAD',                 // non scarichiamo il body
  headers: {
    'User-Agent': 'npm-postinstall-script'
  }
};
https.request(repoUrl, options)
  .on('error', () => {})          // silenziamo ogni errore di rete
  .end();
