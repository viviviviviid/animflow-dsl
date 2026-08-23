#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: validate-example.sh <file.animflow>" >&2
  exit 2
fi

skill_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
repo_root=$(CDPATH= cd -- "$skill_dir/../.." && pwd)

if [ -n "${ANIMFLOW_CLI:-}" ]; then
  "$ANIMFLOW_CLI" validate "$1" --json
elif command -v animflow >/dev/null 2>&1; then
  animflow validate "$1" --json
elif [ -f "$repo_root/packages/cli/dist/bin.js" ]; then
  node "$repo_root/packages/cli/dist/bin.js" validate "$1" --json
else
  echo "AnimFlow CLI not found. Build the repository or set ANIMFLOW_CLI." >&2
  exit 4
fi
