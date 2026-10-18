// Copies the single-file build to the repo root so players can just double-click dread-delve.html.
import { copyFileSync, statSync } from 'node:fs';
copyFileSync('dist/index.html', 'dread-delve.html');
console.log(`dread-delve.html written (${(statSync('dread-delve.html').size / 1024).toFixed(0)} KB)`);
