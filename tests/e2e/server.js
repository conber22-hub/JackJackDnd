import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { PeerServer } from 'peer';

// Serve only the baked artefact: accidentally testing Vite's source entry is impossible.
const html = await readFile(new URL('../../dread-delve.html', import.meta.url));
const app = createServer((req, res) => {
  if (new URL(req.url, 'http://localhost').pathname !== '/dread-delve.html'){
    res.writeHead(404).end(); return;
  }
  res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(html);
});
let relay;
PeerServer({ host:'127.0.0.1', port:9000, path:'/', key:'dreaddelve' }, server => {
  relay = server;
  app.listen(4173, '127.0.0.1');
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  app.close();
  relay?.close();
  process.exit(0);
});
