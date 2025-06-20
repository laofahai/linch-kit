#!/bin/bash
set -e

echo "🚀 Setting up Linch Kit development environment..."

# Update system packages
sudo apt-get update -y

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm using npm with sudo
sudo npm install -g pnpm@8

# Verify pnpm installation
pnpm --version

# Install dependencies with force to recreate lockfile
echo "📦 Installing dependencies..."
pnpm install --force

# Build packages first (required for tests)
echo "🔨 Building packages..."
pnpm build:packages

# Create Jest configuration for the core package
echo "📝 Creating Jest configuration..."
cat > packages/core/jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
EOF

# Install ts-jest for the core package
echo "📦 Installing ts-jest..."
cd packages/core
pnpm add -D ts-jest
cd ../..

# Create a simple test file to verify the environment works
echo "📝 Creating a simple test file..."
mkdir -p packages/core/src/__tests__
cat > packages/core/src/__tests__/basic.test.ts << 'EOF'
describe('Basic Environment Test', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify Node.js environment', () => {
    expect(typeof process).toBe('object')
    expect(process.version).toBeDefined()
  })
})
EOF

# Create a simple test for types package using vitest
echo "📝 Creating test for types package..."
mkdir -p packages/types/src/__tests__
cat > packages/types/src/__tests__/basic.test.ts << 'EOF'
import { describe, it, expect } from 'vitest'

describe('Types Package Test', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify environment', () => {
    expect(typeof process).toBe('object')
  })
})
EOF

echo "✅ Setup complete! Environment is ready for testing."