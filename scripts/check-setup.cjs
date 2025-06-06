#!/usr/bin/env node
const { execSync } = require('child_process');
const commands = [
  { cmd: 'npx eslint -v', name: 'eslint' },
  { cmd: 'npx vite --version', name: 'vite' }
];
let hasError = false;
for (const { cmd, name } of commands) {
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (err) {
    console.warn(`Warning: ${name} is not available. Run \"npm install\" before using lint or build scripts.`);
    hasError = true;
  }
}
if (hasError) {
  process.exitCode = 1;
}
