# Local packaging

- Purpose: build frontend and immutable Debian/install/source bundles in staging only.
- Owns: build/package scripts and offline package verification.
- Read when: changing artifact shape, licensing payload, release identity or packaging.
- Inputs: built page/dist/stream and source; Linux dpkg-deb/Python/Node.
- Outputs: artifacts install/source ZIPs, Debian package, pairing manifest and hashes.
- Invariants: no installation/publication/API calls; no overwriting output; no hooks/helpers for this plugin; exclude dependencies, browser output, caches and credentials. Source root is mos-stream/.
- Verification: python3 scripts/test-package.py verifies metadata, payload paths, hashes and reproducibility; package-local.py --output requires fresh output for repeated builds.
- Routes: None.
