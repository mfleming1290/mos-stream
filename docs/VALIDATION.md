# Local validation — 0.1.0

2026-11-22, Windows NTFS source at G:/code/mos-stream.

- Passed: Windows npm ci --ignore-scripts, npm test (12/12), npm run build including shared-Vue production federation/CSS smoke.
- Passed: Ubuntu24.04 WSL python3 scripts/test-package.py (2/2), including Debian metadata/payload, no maintainer scripts, ZIP/source pairing hashes and byte-identical repeated packages.
- Passed: Edge through Playwright CLI against loopback fixture. Loaded compiled federation with shared Vue, saved URL/name, switched URL, reloaded and verified exact frame src, disconnected/reconnected, entered fullscreen and reviewed540px settings screenshot. No final browser console errors; development Vue fixture warning only.
- Fixed during check: settings panel now hides the still-mounted frame while editing so narrow layouts keep form actions accessible. Initial fixture loader assumed a default export; corrected fixture to support actual federation factory output.
- Not run: installed MOS API authentication/settings, Hub import/install, real Selkies video/audio/input, server framing headers and browser feature delegation.
- No container lifecycle, privileged command, remote publication or installed app replacement occurred.

Browser screenshots/logs live in ignored output/playwright and .playwright-cli; they are not included in source/install ZIPs. A local fixture is not evidence of a working live Selkies connection.
