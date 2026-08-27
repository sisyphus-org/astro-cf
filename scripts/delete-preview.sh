#!/usr/bin/env bash
set -euo pipefail

worker_name=${1:-}
confirmation=${2:-}

if [[ ! "$worker_name" =~ ^astro-cf-preview-[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Refusing to delete: expected an astro-cf-preview-* Worker name." >&2
  exit 2
fi

if [[ "$worker_name" == "astro-cf" ]]; then
  echo "Refusing to delete the production Worker." >&2
  exit 2
fi

if [[ "$confirmation" != "--confirm" ]]; then
  echo "Dry guard only. Re-run with --confirm to delete: $worker_name" >&2
  exit 3
fi

exec npx wrangler delete "$worker_name"
