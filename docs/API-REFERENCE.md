# MOS settings contract

Based on the supplied starter's MOS API commit31850c64c9bb169f886d02dc6adea23d17016057 reference and host Vue federation conventions. Target installed API has not been exercised.

GET/POST `/api/v1/mos/plugins/settings/stream` use the current MOS localStorage `authToken` as a Bearer header, same origin only. POST replaces a complete JSON object. Owned keys: `url` (HTTP/S string, empty allowed), `label` (1–120 characters), `autoConnect` (boolean). Unknown keys survive edits. No CAS is available: coordinate concurrent editors. Save confirms owned keys by GET; an error or mismatch locks further saves until explicit reload. A failed read never authorizes overwriting with defaults.

No function/query APIs are used. No backend helpers or lifecycle hooks are required. No MOS token is attached to stream URLs, links or frame requests. The frame has separate-origin sandbox permissions for scripts, same-origin storage, forms, pointer lock and downloads. It does not receive top-navigation/popups or microphone/camera permissions. Stream server headers and browser policy remain authoritative.

MOS loads `/_plugins/stream/remoteEntry.js`, calls `get('./Plugin')`, and supplies shared Vue. Package assets install under `/var/www/mos-plugins/stream/`. Settings live at `/boot/optional/plugins/stream/settings.json` according to the supplied host contract. Do not import private host stores/router or bundle another Vue.
