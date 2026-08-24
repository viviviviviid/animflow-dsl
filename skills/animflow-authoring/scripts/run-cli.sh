#!/bin/sh
set -eu

skill_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
repo_root=$(CDPATH= cd -- "$skill_dir/../.." && pwd)

if [ -n "${ANIMFLOW_CLI:-}" ]; then
  exec "$ANIMFLOW_CLI" "$@"
elif command -v animflow >/dev/null 2>&1; then
  exec animflow "$@"
elif [ -f "$skill_dir/vendor/animflow-cli.js" ]; then
  exec node "$skill_dir/vendor/animflow-cli.js" "$@"
elif [ -f "$repo_root/packages/cli/dist/bin.js" ]; then
  exec node "$repo_root/packages/cli/dist/bin.js" "$@"
else
  echo "AnimFlow CLI not found. Install animflow-authoring-skill, build the repository, or set ANIMFLOW_CLI." >&2
  exit 4
fi
