export const defaults = Object.freeze({ url: '', label: 'Selkies stream', autoConnect: true });
export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function validateSettings(value) {
  if (!isObject(value)) throw new Error('Settings must be a JSON object.');
  if (typeof value.url !== 'string' || value.url.length > 4096) throw new Error('Enter a URL of at most 4096 characters.');
  if (value.url) {
    if (value.url !== value.url.trim() || /[\u0000-\u0020\u007f]/.test(value.url)) throw new Error('Remove spaces or control characters from the URL.');
    let parsed;
    try { parsed = new URL(value.url); } catch { throw new Error('Enter a complete http:// or https:// URL.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Only HTTP and HTTPS stream URLs are supported.');
    if (parsed.username || parsed.password) throw new Error('Do not put login credentials in the stream URL.');
  }
  if (typeof value.label !== 'string' || !value.label.trim() || value.label.length > 120) throw new Error('Name must contain 1–120 characters.');
  if (typeof value.autoConnect !== 'boolean') throw new Error('Auto-connect must be true or false.');
  return value;
}
export function fromSettings(value) {
  if (!isObject(value)) throw new Error('The host returned invalid settings.');
  return validateSettings({ ...defaults, ...value });
}
export function mergeSettings(original, draft) {
  if (!isObject(original)) throw new Error('Load settings successfully before saving.');
  return validateSettings({ ...original, url: draft.url.trim(), label: draft.label.trim(), autoConnect: draft.autoConnect });
}
export function streamUrl(value, location) {
  validateSettings({ ...defaults, url: value });
  if (!value) throw new Error('Set a stream URL in Settings first.');
  const url = new URL(value);
  if (url.origin === location.origin) throw new Error('Use a separate origin for Selkies (a different host or port from MOS).');
  if (location.protocol === 'https:' && url.protocol !== 'https:') throw new Error('MOS uses HTTPS. Use an HTTPS stream URL to avoid blocked mixed content.');
  return url.href;
}
