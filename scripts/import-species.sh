#!/usr/bin/env bash
# Imports the generated world species list. Pass --local or --remote.
#
# Each file is sent separately because `d1 execute --file` posts the whole
# file in one request; 9 MB in one go is rejected.
set -euo pipefail
TARGET="${1:---local}"
W="./node_modules/.bin/wrangler"

for f in data/world-species/*.sql; do
  printf '%s ... ' "$f"
  $W d1 execute aviguessr-db "$TARGET" --file="$f" >/dev/null
  echo "ok"
done
echo "imported"
