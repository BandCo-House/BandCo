#!/bin/sh
set -eu

# dist 실행 시 Prisma 런타임 파일이 함께 있어야 generated client를 찾을 수 있다.
mkdir -p dist/generated
rm -rf dist/generated/prisma
cp -R src/generated/prisma dist/generated/prisma
