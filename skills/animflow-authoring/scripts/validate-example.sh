#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: validate-example.sh <file.animflow>" >&2
  exit 2
fi

skill_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec "$skill_dir/scripts/run-cli.sh" validate "$1" --json
