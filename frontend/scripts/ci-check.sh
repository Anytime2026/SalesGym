#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> npm ci"
npm ci

echo "==> format:check"
npm run format:check

echo "==> lint"
npm run lint

echo "CI checks passed."
