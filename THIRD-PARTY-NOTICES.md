# License and source notes

This template is distributed under AGPL-3.0-only. The accompanying `LICENSE` is
the complete AGPL-3.0 license supplied with the MOS frontend reference. The page
is an original small semantic-HTML implementation; its federation and packaging
conventions follow the inspected MOS contracts. No host router/store code has
been transplanted. Preserve notices for any additional code copied in later.

## Inspected references

- User-provided `MOS-HUB-LOCAL-BUILD-PACK`: package contract, starter requirements,
  architecture, acceptance and publishing notes (October 2026).
- User-provided MOS frontend: `src/composables/usePlugins.ts`,
  `src/views/pluginView.vue`, `vite.config.js`; AGPL-3.0.
- Working MOS Desktop 0.2.3 local test bundle: Debian identity, web root,
  template/config and numeric-version ZIP structure.
- [Binary Manager Vite config](https://github.com/mfleming1290/mos-binary-manager/blob/main/page/vite.config.js),
  inspected Git blob `91c40ebc1566dca4495f7ddc85b7005ac5235e13`, and its
  `page/package.json` blob `b5d3b31f3190f93cba86d53f25fac15369959899`:
  build conventions and known exact dependency versions. These references are
  provenance, not a claim that future main-branch content is unchanged.

## Direct build dependencies

- Vue 3.5.43: MIT. Runtime provided by MOS through the shared scope; this remote
  disables bundling a fallback Vue copy.
- Vite 7.3.7: MIT. Pinned for the verified OriginJS federation/CSS build contract.
- `@vitejs/plugin-vue` 6.0.10: MIT.
- `@originjs/vite-plugin-federation` 1.4.1: MulanPSL-2.0.

The lockfile records transitive packages and integrity. Review dependency license
files in `node_modules` after installation before redistributing dependency
source or changing the build. Package-generated federation loader code may
derive from the federation tool; its license text is retained under
`docs/licenses/` when supplied with this starter. Source ZIPs intentionally
exclude `node_modules`, install/build outputs and credentials.

For modified AGPL covered works, comply with applicable corresponding-source and
network-interaction requirements. Keep source downloads available to users as
required; the generated complete source ZIP supports that obligation. The
license text is authoritative; this brief note is not legal advice.
