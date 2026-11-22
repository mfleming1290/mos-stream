import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import config from './plugin.config.js';

if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(config.name)) throw new Error('Unsafe plugin name');
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(config.version)) throw new Error('Use numeric x.y.z version');
const outDir = fileURLToPath(new URL(`./dist/${config.name}/`, import.meta.url));
export default defineConfig({
  // Verified MOS static route; avoids OriginJS's './' dotless-host CSS bug.
  base: `/_plugins/${config.name}/`,
  plugins: [
    vue(),
    federation({
      name: config.name,
      filename: 'remoteEntry.js',
      exposes: { './Plugin': './src/Plugin.vue' },
      // MOS injects its Vue into the shared scope. Never bundle a second runtime.
      shared: { vue: { import: false, generate: false, requiredVersion: false } },
    }),
    { name: 'mos-plugin-manifest', closeBundle() {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(`${outDir}/manifest.json`, JSON.stringify(config, null, 2) + '\n');
    } },
  ],
  build: {
    target: 'esnext', outDir, assetsDir: '', minify: false,
    cssCodeSplit: false, rollupOptions: { input: {} },
  },
});
