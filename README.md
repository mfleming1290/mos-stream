# MOS Stream

MOS plugin0.1.0 for opening an existing Selkies web client in the MOS plugin view. Settings changes the stream URL and display name. Save & connect switches to the confirmed saved URL; reconnect remounts the client; disconnect/closing the view does not stop the remote application. Fullscreen is browser fullscreen, not a second window manager.

Built from the supplied MOS plugin starter, using the same host Vue federation and settings contract as MOS Desktop. No daemon, native binary, lifecycle hook or arbitrary command execution is included. The plugin embeds the existing web client; it does not decode WebRTC itself, proxy a stream, provision containers or create a new Selkies server.

## Use

Install **MOS Stream** from the personal [MOS Hub catalogue](https://github.com/mfleming1290/mos-hub), then open its plugin page. Alternatively import `artifacts/mos-stream-0.1.0-install.zip` into Hub Local, paired with its source ZIP and pairing manifest. In Settings paste the browser-facing Selkies HTTP(S) URL, choose a name, and Save & connect. Settings can be reopened to switch streams. The auto-connect preference controls opening a saved stream on the next plugin mount; Save & connect is always an explicit connection action.

The URL must be reachable from the user's browser, use HTTPS when MOS uses HTTPS, and have a different origin (host or port) from MOS. `127.0.0.1` refers to the browser's machine. Selkies/proxy must permit embedding by the MOS origin; frame-ancestors/X-Frame-Options, invalid certificates, reverse-proxy WebSockets or browser permissions can prevent operation. Configure those on the stream server; this plugin does not bypass them. Authenticate within Selkies or open it in a separate tab if the browser blocks embedded authentication. Remote content must not redirect into the privileged MOS origin.

Stream name changes the plugin's internal heading; the host's outer plugin title remains MOS Stream. There is no unsupported host window API dependency. Settings are shared plugin settings on the MOS host, not per-user secrets. Never store passwords/tokens in the URL. Clipboard/fullscreen/autoplay/gamepad are delegated to the frame subject to browser/server policy; microphone/camera and top-level navigation are not enabled. A frame load only means a page opened, not that video/input is connected.

## Build locally

Node22.12+, npm, Python3; packaging additionally requires Linux `dpkg-deb`. Windows frontend build:

```powershell
cd page
npm ci --ignore-scripts
npm test
npm run build
```

For Debian/Hub packaging from Windows using existing Ubuntu WSL:

```powershell
wsl -d Ubuntu-24.04 -- bash -lc 'cd /mnt/g/code/mos-stream && python3 scripts/package-local.py'
wsl -d Ubuntu-24.04 -- bash -lc 'cd /mnt/g/code/mos-stream && python3 scripts/test-package.py'
```

Alternatively Linux: `bash scripts/build-local.sh` then `bash scripts/package-local.sh`. Do not share `node_modules` between operating systems for Vite builds. WSL may package the already built Windows frontend without executing its dependencies. Output is immutable: repeated packaging requires a fresh `--output` directory. New changed releases require a new numeric version.

## Verification and limits

12 Node tests cover settings/API/session behavior. Production federation smoke loads `./Plugin` with shared Vue, renders it, verifies CSS routes on dotless hosts and rejects bundled Vue. Offline package tests verify Debian payload, no maintainer scripts, ZIP paths/hash pairing and same-toolchain reproducibility. Browser fixture: `cd page; node test/serve-fixture.mjs` serves only loopback4177/4178 and never contacts MOS. Fixture browser checks establish settings/save/switch/reload/disconnect behavior, not real streaming.

Actual installed MOS authentication, Hub installation and live Selkies video/audio/input remain unverified until run on a selected host. See [local installation](docs/LOCAL-INSTALL.md) and [API contract](docs/API-REFERENCE.md).

## License

AGPL-3.0-only, preserving starter license and third-party notices. Source ZIP contains corresponding source; install ZIP is compiled deployment material. No private Battlemoon SDK source is included.
