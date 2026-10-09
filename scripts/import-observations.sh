#!/usr/bin/env bash
# Applies the generated observation counts. Pass --local or --remote.
set -euo pipefail
TARGET="${1:---local}"
W="./node_modules/.bin/wrangler"

for f in data/observations/*.sql; do
  printf '%s ... ' "$f"
  $W d1 execute aviguessr-db "$TARGET" --file="$f" >/dev/null
  echo "ok"
done
echo "imported"
