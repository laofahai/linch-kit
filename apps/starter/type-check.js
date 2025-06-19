#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running TypeScript type check...');
  
  // 使用项目根目录的 TypeScript
  const tscPath = path.join(__dirname, '../../node_modules/.bin/tsc');
  const result = execSync(`${tscPath} --noEmit`, {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Type check passed!');
  console.log(result);
} catch (error) {
  console.log('❌ Type check failed:');
  console.log(error.stdout);
  process.exit(1);
}
