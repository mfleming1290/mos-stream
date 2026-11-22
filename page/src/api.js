import config from '../plugin.config.js';
import { fromSettings, validateSettings } from './settings.js';
export async function apiRequest(path, options = {}) {
  const token = globalThis.localStorage?.getItem('authToken');
  if (!token) throw new Error('Sign in to MOS before using this plugin.');
  const response = await fetch(`/api/v1/mos/plugins/${path}`, {
    ...options, credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`MOS request failed (${response.status}). Reload settings before retrying a save.`);
  return response.status === 204 ? null : response.json();
}
export async function loadSettings() { return fromSettings(await apiRequest(`settings/${config.name}`)); }
export async function saveSettings(settings) {
  validateSettings(settings);
  await apiRequest(`settings/${config.name}`, { method: 'POST', body: JSON.stringify(settings) });
}
