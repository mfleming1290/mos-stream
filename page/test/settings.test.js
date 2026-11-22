import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, fromSettings, mergeSettings, streamUrl } from '../src/settings.js';
test('defaults and future settings are preserved', () => {
  const value = fromSettings({ future: { keep: true } });
  const updated = mergeSettings(value, { ...defaults, label: ' Desktop ', url: ' https://stream.test:3001/path?resize=remote ' });
  assert.deepEqual(updated.future, { keep: true }); assert.equal(updated.label, 'Desktop');
  assert.equal(updated.url, 'https://stream.test:3001/path?resize=remote');
});
test('malformed stored fields are never silently replaced', () => {
  for (const value of [null, [], { url: 1 }, { autoConnect: 'yes' }, { label: '' }, { url: 'javascript:alert(1)' }, { url: 'https://user:password@stream.test' }, { url: 'file:///tmp/x' }, { url: '//stream.test' }]) assert.throws(() => fromSettings(value));
});
test('frame URL preserves path/query and blocks same-origin and mixed content', () => {
  assert.equal(streamUrl('https://stream.test/desktop/?x=1', { origin: 'https://mos.test', protocol: 'https:' }), 'https://stream.test/desktop/?x=1');
  assert.throws(() => streamUrl('https://mos.test/path', { origin: 'https://mos.test', protocol: 'https:' }), /separate origin/);
  assert.throws(() => streamUrl('http://stream.test', { origin: 'https://mos.test', protocol: 'https:' }), /HTTPS/);
  assert.equal(streamUrl('http://mos.test:3000', { origin: 'http://mos.test', protocol: 'http:' }), 'http://mos.test:3000/');
});
