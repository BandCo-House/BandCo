#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKEND_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$BACKEND_DIR"

run_step() {
  step_name=$1
  shift

  printf '\n==> %s\n' "$step_name"
  "$@"
}

run_step "lint" pnpm run lint
run_step "format:check" pnpm run format:check
run_step "build" pnpm run build
run_step "test" pnpm run test
