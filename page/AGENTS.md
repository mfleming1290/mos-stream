# Stream frontend

- Owns: Vue federated plugin, settings/API/session modules and tests.
- Read when: changing stream interaction, URL/settings handling or federation.
- Inputs: MOS host Vue and same-origin authenticated settings API; external Selkies web client.
- Outputs: `dist/stream/remoteEntry.js` exposes `./Plugin`; no standalone production mount.
- Invariants: never forward MOS tokens to streams; reject same-origin frame URLs and HTTPS-to-HTTP mixed content; preserve unknown settings; disable writes after failed reads/uncertain saves until reload. No backend/container control. A frame load is not video/input health.
- Verification: `npm ci --ignore-scripts`, `npm test`, `npm run build`. `node test/serve-fixture.mjs` hosts an isolated browser fixture at localhost4177/4178, not live MOS/Selkies proof.
- Routes: None.
