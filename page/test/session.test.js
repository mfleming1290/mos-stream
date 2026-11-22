import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, createSession } from '../src/session.js';
import { defaults } from '../src/settings.js';
function fixture(value = { ...defaults, url: 'https://stream.test/a' }) {
  const state = initialState(); let saved = structuredClone(value), writes = 0, failLoad = false, failSave = false;
  const api = { async loadSettings() { if (failLoad) throw Error('offline'); return structuredClone(saved); },
    async saveSettings(v) { writes++; if (failSave) throw Error('uncertain'); saved = structuredClone(v); } };
  return { state, api, session: createSession(state, api, { origin: 'https://mos.test', protocol: 'https:' }),
    get saved() { return saved; }, get writes() { return writes; }, failLoad() { failLoad = true; }, failSave() { failSave = true; } };
}
test('initial load auto-opens saved URL; reconnect remounts and disconnect leaves settings', async () => {
  const f = fixture(); await f.session.initialize(); assert.equal(f.state.source, 'https://stream.test/a');
  const revision = f.state.revision; f.session.connect(); assert.equal(f.state.revision, revision + 1);
  f.session.disconnect(); assert.equal(f.state.source, ''); assert.equal(f.saved.url, 'https://stream.test/a');
});
test('save switches only after confirmation and preserves unknown keys', async () => {
  const f = fixture({ ...defaults, url: 'https://stream.test/a', future: { keep: true } });
  await f.session.initialize(); f.state.draft.url = 'https://second.test/b';
  await f.session.save(); assert.equal(f.state.source, 'https://second.test/b');
  assert.deepEqual(f.saved.future, { keep: true }); assert.equal(f.writes, 1);
});
test('failed load prevents defaults overwriting saved values', async () => {
  const f = fixture(); f.failLoad(); await f.session.initialize(); await f.session.save();
  assert.equal(f.state.loaded, false); assert.equal(f.writes, 0); assert.equal(f.state.source, '');
});
test('uncertain save locks retries and retains existing stream', async () => {
  const f = fixture(); await f.session.initialize(); f.failSave();
  f.state.draft.url = 'https://second.test'; await f.session.save(); await f.session.save();
  assert.equal(f.state.loaded, false); assert.equal(f.writes, 1); assert.equal(f.state.source, 'https://stream.test/a');
});
test('read-back conflict does not connect to concurrent editor value', async () => {
  const f = fixture(); await f.session.initialize(); f.state.draft.url = 'https://second.test';
  f.api.saveSettings = async () => {}; await f.session.save();
  assert.equal(f.state.loaded, false); assert.equal(f.state.source, 'https://stream.test/a'); assert.match(f.state.error, /confirmation/);
});
test('clear URL disconnects; cancelled edits never publish', async () => {
  const f = fixture(); await f.session.initialize(); f.state.draft.url = 'https://changed.test'; f.session.cancelSettings();
  assert.equal(f.state.draft.url, 'https://stream.test/a'); assert.equal(f.writes, 0);
  f.state.draft.url = ''; await f.session.save(); assert.equal(f.state.source, ''); assert.equal(f.saved.url, '');
});
test('auto-connect off waits for explicit action; disposal prevents late attach', async () => {
  const f = fixture({ ...defaults, autoConnect: false, url: 'https://stream.test' });
  await f.session.initialize(); assert.equal(f.state.source, ''); f.session.connect(); assert.equal(f.state.source, 'https://stream.test/');
  f.session.dispose(); f.session.connect(); assert.equal(f.state.source, '');
});
test('invalid or mixed content URL never saves or replaces stream', async () => {
  const f = fixture(); await f.session.initialize(); f.state.draft.url = 'http://stream.test';
  await f.session.save(); assert.equal(f.writes, 0); assert.equal(f.state.source, 'https://stream.test/a');
});
