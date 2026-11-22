# Stream implementation and build notes

This project adapts the supplied MOS plugin starter. Required identity `stream` is consistent across config, manifest, API and archive paths. Source repo/package name is mos-stream/mos-stream-plugin. Version0.1.0 is the first local candidate, not an installed acceptance claim.

The stream page uses semantic HTML/scoped CSS and host Vue federation. `settings.js` validates fields and frame URL policy; `session.js` owns small local interaction state, settings confirmation and attach/detach behavior; `api.js` performs same-origin settings calls. `Plugin.vue` is the UI. No SDK, window framework or server-side extension is necessary for this slice.

Packaging scripts build offline in temporary staging with dpkg-deb; they never install. Browser fixture outputs and local Playwright caches are excluded from source packages. Source/install manifests are integrity metadata, not signatures. Preserve LICENSE/NOTICE and dependency notices. Versions and lockfile identity must agree; never overwrite existing artifacts.

The earlier MOS Desktop personal stream donor attaches through its authenticated personal gateway with a fixed relative path. MOS Stream deliberately targets independently supplied external web client URLs instead; it does not claim that gateway's owner/controller admission or connect to its backend automatically. It preserves the useful rule that closing a view does not stop remote applications and reports page-load state honestly.
