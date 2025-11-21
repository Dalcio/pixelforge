#!/bin/bash
set -e

echo "Building dependencies..."
pnpm --filter @fluximage/types build
pnpm --filter @fluximage/utils build

echo "Building Worker..."
pnpm --filter @fluximage/worker build

echo "Build complete!"
