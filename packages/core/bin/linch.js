#!/usr/bin/env node
/**
 * LinchKit CLI 入口
 * 
 * 这是 LinchKit 框架的主要命令行工具入口
 */

// 使用 CommonJS 以确保兼容性
const { createRequire } = require('module');
const require = createRequire(import.meta.url || __filename);

// 动态导入 ESM 模块
async function main() {
  try {
    const { LinchKitCLI } = await import('../dist/cli/linch-cli.js');
    const cli = new LinchKitCLI();
    await cli.run(process.argv);
  } catch (error) {
    // 如果找不到编译后的文件，尝试使用 tsx 运行源文件
    if (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'MODULE_NOT_FOUND') {
      console.log('正在使用开发模式运行...');
      try {
        // 使用 tsx 运行 TypeScript 源文件
        const { execSync } = require('child_process');
        const path = require('path');
        const tsxPath = path.join(__dirname, '../src/cli/linch-cli.ts');
        execSync(`tsx ${tsxPath}`, { stdio: 'inherit' });
      } catch (devError) {
        console.error('错误：无法运行 LinchKit CLI');
        console.error('请确保已经构建项目：pnpm build');
        process.exit(1);
      }
    } else {
      console.error('LinchKit CLI 运行错误:', error);
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('致命错误:', error);
  process.exit(1);
});