import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const UI_DIR = path.resolve(__dirname, '../../packages/react/src/ui');
const BARREL = '\0syntara-react-barrel';

/** '@syntara/react' → a live barrel of whatever exists in src/ui right now (components land while agents work). */
function liveBarrel(): Plugin {
  return {
    name: 'syntara-live-barrel',
    enforce: 'pre',
    resolveId(id) {
      return id === '@syntara/react' ? BARREL : null;
    },
    load(id) {
      if (id !== BARREL) return null;
      const files = readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx'));
      return files.map((f) => `export * from ${JSON.stringify(path.join(UI_DIR, f))};`).join('\n');
    },
    configureServer(server) {
      server.watcher.add(UI_DIR);
      server.watcher.on('add', (file) => {
        if (file.startsWith(UI_DIR)) {
          const mod = server.moduleGraph.getModuleById(BARREL);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [liveBarrel(), react()],
  resolve: { dedupe: ['react', 'react-dom', 'react-aria-components'] },
  server: { host: '127.0.0.1' },
});
