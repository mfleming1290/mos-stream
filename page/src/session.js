import { defaults, mergeSettings, streamUrl } from './settings.js';
export function initialState() {
  return { loaded: false, busy: false, original: null, draft: { ...defaults }, settingsOpen: false,
    source: '', streamLabel: '', revision: 0, pageLoaded: false, error: '', notice: '' };
}
export function createSession(state, api, location) {
  let disposed = false;
  function disconnect() { state.source = ''; state.pageLoaded = false; }
  function connect() {
    if (!state.loaded || state.busy || !state.original || disposed) return;
    try {
      const source = streamUrl(state.original.url, location);
      state.error = ''; state.notice = ''; state.pageLoaded = false;
      state.streamLabel = state.original.label; state.source = source; state.revision++;
    } catch (error) { state.error = error.message; state.settingsOpen = true; }
  }
  async function load() {
    if (state.busy || disposed) return;
    state.busy = true; state.loaded = false; state.error = ''; state.notice = '';
    try {
      const value = await api.loadSettings();
      if (disposed) return;
      state.original = value; state.draft = { url: value.url, label: value.label, autoConnect: value.autoConnect };
      state.loaded = true; state.settingsOpen = !value.url;
    } catch (error) { if (!disposed) { state.error = error.message; state.settingsOpen = true; } }
    finally { state.busy = false; }
  }
  async function initialize() {
    await load();
    if (!disposed && state.loaded && state.original.url && state.original.autoConnect) connect();
  }
  async function save() {
    if (state.busy || !state.loaded || disposed) return;
    let merged;
    try {
      merged = mergeSettings(state.original, state.draft);
      if (merged.url) streamUrl(merged.url, location);
    } catch (error) { state.error = error.message; return; }
    state.busy = true; state.error = ''; state.notice = '';
    try {
      await api.saveSettings(merged);
      const confirmed = await api.loadSettings();
      if (disposed) return;
      for (const key of ['url', 'label', 'autoConnect']) {
        if (confirmed[key] !== merged[key]) throw new Error('Saved settings changed during confirmation. Reload and review before reconnecting.');
      }
      state.original = confirmed; state.draft = { url: confirmed.url, label: confirmed.label, autoConnect: confirmed.autoConnect };
      disconnect(); state.settingsOpen = !confirmed.url;
      state.notice = confirmed.url ? 'Settings saved.' : 'URL cleared. Stream disconnected.';
    } catch (error) { if (!disposed) { state.loaded = false; state.error = error.message; } }
    finally { state.busy = false; }
    if (state.loaded && !disposed && state.original.url) connect();
  }
  function cancelSettings() {
    if (state.busy) return;
    if (state.original) state.draft = { url: state.original.url, label: state.original.label, autoConnect: state.original.autoConnect };
    state.error = ''; state.settingsOpen = false;
  }
  return { initialize, load, save, connect, disconnect, cancelSettings,
    dispose() { disposed = true; disconnect(); } };
}
