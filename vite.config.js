import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run dev`   -> live editing at http://localhost:5173
// `npm run build` -> dist/index.html with every script inlined, copied to ./dread-delve.html
//                    (double-click it; Three.js and PeerJS are baked in, so the 3D works offline)
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2020', assetsInlineLimit: 100000000, chunkSizeWarningLimit: 4000 },
});
