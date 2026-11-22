import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSettings, saveSettings } from '../src/api.js';
import { defaults } from '../src/settings.js';
test('MOS token stays on same-origin settings API, full object round-trips', async () => {
  const originalFetch = globalThis.fetch, originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const calls = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'fixture-token' } });
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ ...defaults, extra: 7 }) }; };
  try {
    const value = await loadSettings(); await saveSettings(value);
    assert.equal(calls.length, 2);
    for (const call of calls) { assert.equal(call.url, '/api/v1/mos/plugins/settings/stream'); assert.equal(call.options.headers.Authorization, 'Bearer fixture-token'); }
    assert.equal(JSON.parse(calls[1].options.body).extra, 7);
    globalThis.fetch = async () => ({ ok: false, status: 503 }); await assert.rejects(loadSettings(), /503/);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
    await assert.rejects(loadSettings(), /Sign in/);
  } finally { globalThis.fetch = originalFetch; if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else delete globalThis.localStorage; }
});
