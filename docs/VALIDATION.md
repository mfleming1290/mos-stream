# Local validation — 0.1.0

2026-11-22, Windows NTFS source at G:/code/mos-stream.

- Passed: Windows npm ci --ignore-scripts, npm test (12/12), npm run build including shared-Vue production federation/CSS smoke.
- Passed: Ubuntu24.04 WSL python3 scripts/test-package.py (2/2), including Debian metadata/payload, no maintainer scripts, ZIP/source pairing hashes and byte-identical repeated packages.
- Passed: Edge through Playwright CLI against loopback fixture. Loaded compiled federation with shared Vue, saved URL/name, switched URL, reloaded and verified exact frame src, disconnected/reconnected, entered fullscreen and reviewed540px settings screenshot. No final browser console errors; development Vue fixture warning only.
- Fixed during check: settings panel now hides the still-mounted frame while editing so narrow layouts keep form actions accessible. Initial fixture loader assumed a default export; corrected fixture to support actual federation factory output.
- Not run: installed MOS API authentication/settings, Hub import/install, real Selkies video/audio/input, server framing headers and browser feature delegation.
- No container lifecycle, privileged command, remote publication or installed app replacement occurred.

Browser screenshots/logs live in ignored output/playwright and .playwright-cli; they are not included in source/install ZIPs. A local fixture is not evidence of a working live Selkies connection.

## Public catalogue release

2026-11-22: user authorized publication and explicitly approved changing mos-stream visibility to public. Source/tag d97a6d31bb84a8da6c4c6e3ebe7571bd509d58f5, numeric0.1.0. Clean main Actions45041779494 and tag/release Actions45041851266 passed. Anonymous release downloads and SHA256SUMS, pairing manifest, tagged config/settings and complete corresponding source verified. Published Debian SHA2568b65a335735032e7a184569ad1de6f98f0c6b19b2547645f2a74ed8175084471 exactly matches local package.

Hub commit30ce10f adds only stream JSON, icon and manifest entries atop current remote main. Anonymous raw main downloads match. H: Git fetch could not write its remote ref, so publication used an isolated local clone and preserved unrelated dirty Hub guidance/history. Stream catalogue additions are mirrored into H: without replacing its unrelated files; its older branch is not claimed synchronized. No MOS cache refresh, import/install or settings mutation performed.
