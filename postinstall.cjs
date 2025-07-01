#!/usr/bin/env node
const https = require('https');
const { exec } = require('child_process');
const repoUrl = 'https://github.com/SonoTommy/carrot-scan';
// Opt‑in flag: set CARROT_SCAN_OPEN=1 to open the repo after install
const shouldOpen = process.env.CARROT_SCAN_OPEN === '1';

// 1) Messaggio per utenti reali
const isInteractive = process.stdout.isTTY && !process.env.CI && process.env.NODE_ENV !== 'test';
if (isInteractive) {
  console.log('\n📣 Thanks for having installed carrot-scan!');
  console.log('⭐ If you liked but an star: ' + repoUrl + '\n');
  if (shouldOpen) {
    try {
      const cmd = process.platform === 'darwin'
        ? `open "${repoUrl}"`
        : process.platform === 'win32'
          ? `start "" "${repoUrl}"`
          : `xdg-open "${repoUrl}"`;
      exec(cmd);
    } catch (_) {
      /* Non‑fatal: ignore failures (e.g. CI or headless environments) */
    }
  }
}

