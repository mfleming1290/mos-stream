#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/page"
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run build
python3 "$ROOT/scripts/test-package.py"
printf '\nBuild verified. Run ./scripts/package-local.sh to create local ZIPs.\n'
