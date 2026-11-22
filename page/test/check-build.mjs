import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import * as Vue from 'vue';
import { renderToString } from '@vue/server-renderer';
import config from '../plugin.config.js';

const root = new URL(`../dist/${config.name}/`, import.meta.url);
const files = readdirSync(root);
assert(files.includes('remoteEntry.js'), 'Federation entry must be at the web root');
assert(files.includes('manifest.json'), 'Missing MOS manifest');
assert(!files.some(name => /shared_vue/.test(name)), 'Do not emit a bundled Vue fallback');
for (const name of files.filter(name => name.endsWith('.js'))) {
  assert(!/__VITE_[A-Z0-9_]+__/.test(readFileSync(new URL(name, root), 'utf8')), `Unresolved Vite asset placeholder in ${name}`);
}
assert.deepEqual(JSON.parse(readFileSync(new URL('manifest.json', root))), config);
// Minimal browser stylesheet host; render is server-side and never calls MOS.
const styles = [];
globalThis.document = { createElement: () => ({}), head: { appendChild: element => styles.push(element.href) } };
globalThis.__federation_shared__ = { default: { vue: { [Vue.version]: { get: () => () => Vue, loaded: true } } } };
// Map only the verified HTTP JavaScript chunk route to its actual local artifact.
// The production CSS loader still sees its real MOS deployment URL.
const entryText = readFileSync(new URL('remoteEntry.js', root), 'utf8');
const hostedSource = entryText
  .replaceAll('import.meta.url', JSON.stringify(`https://mos/_plugins/${config.name}/remoteEntry.js`))
  .replace(new RegExp(`(["'])/_plugins/${config.name}/([^"']+\\.js)\\1`, 'g'),
    (_match, _quote, filename) => JSON.stringify(new URL(filename, root).href));
const remote = await import(`data:text/javascript;base64,${Buffer.from(hostedSource).toString('base64')}`);
const factory = await remote.get('./Plugin');
const module = factory();
const component = module.default || module;
const html = await renderToString(Vue.createSSRApp(component, { plugin: config }));
assert(html.includes(config.displayName));
assert(html.includes('Retry loading settings'));
assert(html.includes('disabled'), 'Saving must start disabled before a successful load');
assert(styles.length > 0, 'Federation must load its stylesheet');
// The component imports from disk only for the SSR test. The generated CSS
// loader is evaluated against real MOS HTTP locations and its exact output list.
const cssFiles = styles.map(href => new URL(href).pathname.split('/').at(-1));
for (const name of cssFiles) {
  assert(name.endsWith('.css'), `Unexpected stylesheet reference: ${name}`);
  assert(statSync(new URL(name, root)).isFile(), `Missing emitted CSS: ${name}`);
}
// Exercise the actual generated CSS-loader code with dotless MOS hostnames.
// No network or host API is used, and simulated modules' components are not run.
for (const origin of ['https://mos', 'http://mos', 'http://192.0.2.1']) {
  const deployedRoot = `${origin}/_plugins/${config.name}/`;
  const simulatedText = entryText.replaceAll('import.meta.url', JSON.stringify(`${deployedRoot}remoteEntry.js`));
  const deployed = await import(`data:text/javascript;base64,${Buffer.from(simulatedText).toString('base64')}`);
  const previousStyles = styles.length;
  // get() emits its real stylesheet list before the HTTP JS import, which Node
  // rejects. The component import/render itself was already verified above.
  await assert.rejects(deployed.get('./Plugin'));
  assert.equal(styles.length - previousStyles, cssFiles.length);
  assert.deepEqual(styles.slice(previousStyles), cssFiles.map(name => `${deployedRoot}${name}`));
  for (const href of styles.slice(previousStyles)) {
    assert(statSync(new URL(href.slice(deployedRoot.length), root)).isFile(), `Deployed CSS href has no emitted file: ${href}`);
  }
}
delete globalThis.document;
delete globalThis.__federation_shared__;
console.log('Federation smoke passed: shared host Vue; real CSS files; dotless-host CSS URLs; no unresolved Vite placeholders.');
