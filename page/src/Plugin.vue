<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import config from '../plugin.config.js';
import * as api from './api.js';
import { initialState, createSession } from './session.js';
defineProps({ plugin: { type: Object, default: () => ({}) } });
const state = reactive(initialState());
const session = createSession(state, api, globalThis.location ?? { origin: '', protocol: '' });
const surface = ref(null), settingsButton = ref(null), urlInput = ref(null);
const status = computed(() => !state.source ? 'Disconnected' : state.pageLoaded ? 'Stream page opened' : 'Opening stream page…');
async function openSettings() { state.settingsOpen = true; await nextTick(); urlInput.value?.focus(); }
async function cancelSettings() { session.cancelSettings(); await nextTick(); settingsButton.value?.focus(); }
async function fullscreen() {
  try {
    if (!surface.value?.requestFullscreen) throw new Error('Fullscreen is unavailable in this browser.');
    await surface.value.requestFullscreen();
  } catch (error) { state.error = error.message; }
}
onMounted(session.initialize);
onBeforeUnmount(session.dispose);
</script>

<template>
  <section ref="surface" class="mos-stream" :class="{ 'settings-open': state.settingsOpen || !state.loaded }" aria-label="MOS Stream">
    <header class="stream-toolbar">
      <div class="stream-identity"><span class="stream-icon" aria-hidden="true">▣</span><div><h2>{{ state.streamLabel || config.displayName }}</h2><p role="status">{{ status }}</p></div></div>
      <nav aria-label="Stream controls">
        <button :disabled="!state.loaded || state.busy || !state.original?.url" @click="session.connect">{{ state.source ? 'Reconnect' : 'Connect' }}</button>
        <button :disabled="!state.source" @click="session.disconnect">Disconnect</button>
        <button :disabled="!state.source" @click="fullscreen">Fullscreen</button>
        <button ref="settingsButton" :aria-expanded="state.settingsOpen" aria-controls="mos-stream-settings" @click="state.settingsOpen ? cancelSettings() : openSettings()">Settings</button>
      </nav>
    </header>
    <p v-if="state.error" class="feedback error" role="alert">{{ state.error }}</p>
    <p v-if="state.notice" class="feedback" role="status">{{ state.notice }}</p>
    <section v-if="state.settingsOpen || !state.loaded" id="mos-stream-settings" class="settings-panel" aria-labelledby="stream-settings-title" @keydown.esc="cancelSettings">
      <div class="settings-heading"><div><h3 id="stream-settings-title">Stream settings</h3><p>Choose the Selkies web client you want to open.</p></div><span>v{{ config.version }}</span></div>
      <form @submit.prevent="session.save">
        <fieldset :disabled="state.busy || !state.loaded">
          <label for="stream-name">Stream name</label>
          <input id="stream-name" v-model="state.draft.label" maxlength="120" required autocomplete="off">
          <label for="stream-url">Stream URL</label>
          <input id="stream-url" ref="urlInput" v-model="state.draft.url" type="url" maxlength="4096" placeholder="https://desktop.example.net:3001/" autocomplete="off" spellcheck="false" aria-describedby="stream-url-help">
          <p id="stream-url-help" class="hint">Use the web client URL, not a WebSocket address. Leave empty to clear it. Settings are shared on this MOS host; keep passwords and secret tokens out of the URL.</p>
          <label class="toggle"><input v-model="state.draft.autoConnect" type="checkbox"> Connect automatically when this plugin opens</label>
          <div class="settings-actions"><button class="primary" type="submit">{{ state.busy ? 'Saving…' : 'Save & connect' }}</button><button type="button" @click="cancelSettings">Cancel</button></div>
        </fieldset>
      </form>
      <button class="reload-settings" :disabled="state.busy" @click="session.load">{{ state.loaded ? 'Reload saved settings' : 'Retry loading settings' }}</button>
      <p v-if="state.busy" role="status" class="hint">Loading or confirming settings…</p>
    </section>
    <div class="stream-stage">
      <iframe v-if="state.source" :key="state.revision" :src="state.source" :title="state.streamLabel"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads"
        allow="autoplay; fullscreen; clipboard-read; clipboard-write; gamepad" allowfullscreen
        referrerpolicy="no-referrer" @load="state.pageLoaded = true"></iframe>
      <div v-else class="empty-state"><span class="empty-icon" aria-hidden="true">▣</span><h3>Your streamed desktop, in MOS</h3><p>{{ state.loaded && state.original?.url ? 'Connect to open your saved stream.' : 'Add a Selkies URL in Settings to get started.' }}</p><button class="primary" :disabled="state.busy" @click="openSettings">Stream settings</button></div>
    </div>
    <footer><span>Closing this view leaves the remote application running.</span><details><summary>Stream not showing?</summary><p>The browser must be able to reach the URL. Use HTTPS when MOS uses HTTPS, and a separate host or port from MOS. The stream server must allow framing by MOS. A page load does not confirm video or input connectivity. Sign in within Selkies if requested.</p><a v-if="state.source" :href="state.source" target="_blank" rel="noopener noreferrer">Open stream in a new tab</a></details></footer>
  </section>
</template>

<style scoped>
.settings-open .stream-stage{display:none}.settings-open .settings-panel{flex:1;min-height:0;max-height:none}
.mos-stream{--stream-accent:#8da8ff;display:flex;flex-direction:column;min-height:560px;height:calc(100dvh - 150px);max-height:1100px;background:#11151e;color:#e8edf7;border:1px solid #ffffff1f;border-radius:14px;overflow:hidden;font:inherit;color-scheme:dark}
.mos-stream:fullscreen{height:100dvh;max-height:none;border-radius:0}.stream-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;background:#1b2230;border-bottom:1px solid #ffffff14;flex-wrap:wrap}.stream-identity{display:flex;gap:12px;align-items:center;min-width:0}.stream-icon{font-size:24px;color:var(--stream-accent);padding:6px 10px;border-radius:10px;background:#8da8ff16}.stream-identity h2{font-size:1rem;font-weight:600;margin:0;overflow-wrap:anywhere}.stream-identity p{margin:3px 0 0;color:#aab7cc;font-size:.78rem}nav{display:flex;flex-wrap:wrap;gap:6px}.mos-stream button{border:1px solid #ffffff25;background:#ffffff08;color:inherit;padding:8px 12px;border-radius:8px;font:inherit;font-size:.85rem;cursor:pointer}.mos-stream button:hover:enabled{background:#ffffff15}.mos-stream button.primary{background:#8da8ff;color:#0e1833;border-color:transparent;font-weight:600}.mos-stream button:disabled{opacity:.45;cursor:default}.mos-stream :is(button,input,a,summary):focus-visible{outline:2px solid var(--stream-accent);outline-offset:3px}.settings-panel{padding:20px;overflow:auto;max-height:70%;border-bottom:1px solid #ffffff20;background:#19212e}.settings-heading{display:flex;justify-content:space-between;gap:16px;max-width:680px}.settings-heading h3{margin:0;font-size:1rem}.settings-heading p,.hint{font-size:.82rem;line-height:1.5;color:#b5c0d3}.settings-heading span{font-size:.75rem;color:#aab7cc}form{max-width:680px}fieldset{border:0;margin:0;padding:0;display:grid;gap:8px}fieldset>label:not(.toggle){font-size:.8rem;font-weight:600;margin-top:6px}.mos-stream input:not([type=checkbox]){width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #ffffff30;color:inherit;background:#101722;font:inherit}.hint{margin:0 0 8px}.toggle{display:flex;align-items:center;gap:9px;font-size:.85rem;margin:8px 0}.settings-actions{display:flex;gap:8px;margin:4px 0 12px}.reload-settings{font-size:.78rem!important}.feedback{margin:0;padding:10px 18px;background:#28462c;font-size:.85rem}.feedback.error{background:#542b30;color:#ffdddd}.stream-stage{flex:1;min-height:180px;display:flex;background:#090c12}.stream-stage iframe{border:0;width:100%;flex:1;min-height:180px;background:#090c12}.empty-state{margin:auto;text-align:center;padding:28px;max-width:420px}.empty-icon{font-size:42px;color:#8da8ff}.empty-state h3{font-size:1.1rem;margin:12px 0}.empty-state p{color:#b5c0d3;font-size:.9rem;line-height:1.5}footer{padding:9px 16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:.75rem;color:#aab7cc;border-top:1px solid #ffffff14}footer details{max-width:520px}footer summary{cursor:pointer}footer p{line-height:1.6}footer a{color:#b9c9ff}@media(max-width:640px){.mos-stream{min-height:480px;height:calc(100dvh - 100px);border-radius:8px}.stream-toolbar{padding:12px}.settings-panel{padding:16px}.mos-stream button{padding:8px 10px}nav{width:100%}}
</style>
