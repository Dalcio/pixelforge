#!/bin/bash
set -e

echo "Building dependencies..."
pnpm --filter @fluximage/types build
pnpm --filter @fluximage/utils build

echo "Building Worker (needed by API)..."
pnpm --filter @fluximage/worker build

echo "Building API..."
pnpm --filter @fluximage/api build

echo "Build complete!"
