// Local browser fixture only. Never proxies MOS or a real stream.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { defaults } from '../src/settings.js';
let settings = { ...defaults, futureKey: 'preserved' };
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>MOS Stream fixture</title><style>body{margin:0;padding:16px;background:#0c111b;font:14px system-ui;color:#eee}</style></head><body><div id="app"></div><script type="module">
import * as Vue from '/vue.js';
localStorage.setItem('authToken','local-fixture-only');
const remote = await import('/_plugins/stream/remoteEntry.js');
remote.init({vue:{[Vue.version]:{get:()=>()=>Vue,loaded:true}}});
const factory = await remote.get('./Plugin'); const mod = factory(); Vue.createApp(mod.default || mod).mount('#app');
</script></body></html>`;
const root = new URL('../dist/stream/', import.meta.url);
const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/') { res.setHeader('Content-Type','text/html'); return res.end(html); }
    if (path === '/favicon.ico') { res.statusCode = 204; return res.end(); }
    if (path === '/api/v1/mos/plugins/settings/stream') {
      if (req.method === 'POST') { let body = ''; for await (const chunk of req) body += chunk; settings = JSON.parse(body); }
      res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify(settings));
    }
    let file;
    if (path === '/vue.js') file = new URL('../node_modules/vue/dist/vue.runtime.esm-browser.js', import.meta.url);
    else if (/^\/_plugins\/stream\/[a-zA-Z0-9_.-]+$/.test(path)) file = new URL(path.split('/').at(-1), root);
    else { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type',path.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(readFileSync(file));
  } catch { res.statusCode = 500; res.end('Fixture request failed'); }
});
const stream = http.createServer((req, res) => { res.setHeader('Content-Type','text/html'); res.end('<title>Stream fixture</title><h1>Remote desktop fixture</h1><p>This tests framing, not Selkies video.</p>'); });
server.listen(4177,'127.0.0.1',()=>console.log('Fixture http://127.0.0.1:4177'));
stream.listen(4178,'127.0.0.1');
function stop() { server.close(); stream.close(); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
