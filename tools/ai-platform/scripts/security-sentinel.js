#!/usr/bin/env bun
/**
 * Security Sentinel CLI 脚本
 * LinchKit AI Guardian - Extension和AI代码安全防护
 */

import { SecuritySentinel } from '../dist/guardian/security-sentinel.js'

const action = process.argv[2] || 'scan'
const args = process.argv.slice(3)

// 解析命令行参数
function parseArgs(args) {
  const parsed = {
    target: null,
    extensionName: null,
    aiCode: null,
    verbose: false,
    format: 'text'
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg.startsWith('--target=')) {
      parsed.target = arg.split('=')[1]
    } else if (arg.startsWith('--extension=')) {
      parsed.extensionName = arg.split('=')[1]
    } else if (arg.startsWith('--ai-code=')) {
      parsed.aiCode = arg.split('=')[1]
    } else if (arg === '--verbose') {
      parsed.verbose = true
    } else if (arg.startsWith('--format=')) {
      parsed.format = arg.split('=')[1]
    } else if (!arg.startsWith('--')) {
      // 位置参数
      if (!parsed.target && !parsed.extensionName) {
        parsed.target = arg
      }
    }
  }

  return parsed
}

async function main() {
  try {
    const options = parseArgs(args)
    const sentinel = new SecuritySentinel()

    console.log('🛡️ Security Sentinel - 启动安全检查...')

    let result
    switch (action) {
      case 'scan':
        if (!options.target) {
          console.error('❌ 错误: 请提供扫描目标路径')
          console.log('用法: bun run security:scan --target="path/to/scan"')
          process.exit(1)
        }
        result = await sentinel.claudeSecurityCheck({
          action: 'scan',
          target: options.target,
          verbose: options.verbose,
          format: options.format
        })
        break

      case 'audit':
        if (!options.aiCode) {
          console.error('❌ 错误: 请提供AI代码内容')
          console.log('用法: bun run security:audit --ai-code="代码内容"')
          process.exit(1)
        }
        result = await sentinel.claudeSecurityCheck({
          action: 'audit',
          aiCode: options.aiCode,
          verbose: options.verbose,
          format: options.format
        })
        break

      case 'assess':
        if (!options.extensionName) {
          console.error('❌ 错误: 请提供Extension名称')
          console.log('用法: bun run security:assess --extension="extension-name"')
          process.exit(1)
        }
        result = await sentinel.claudeSecurityCheck({
          action: 'assess',
          extensionName: options.extensionName,
          verbose: options.verbose,
          format: options.format
        })
        break

      case 'quarantine':
        if (!options.target) {
          console.error('❌ 错误: 请提供隔离目标路径')
          console.log('用法: bun run security:quarantine --target="path/to/file"')
          process.exit(1)
        }
        result = await sentinel.claudeSecurityCheck({
          action: 'quarantine',
          target: options.target,
          verbose: options.verbose,
          format: options.format
        })
        break

      case 'help':
      case '--help':
      case '-h':
        console.log(`
🛡️ Security Sentinel - AI代码和Extension安全防护

用法:
  bun run security:sentinel <action> [options]

操作:
  scan                扫描目录安全威胁
  audit               审计AI生成代码
  assess              评估Extension安全性
  quarantine          隔离危险文件
  help                显示此帮助

选项:
  --target=<path>     扫描目标路径
  --extension=<name>  Extension名称
  --ai-code=<code>    AI生成的代码
  --verbose           详细输出
  --format=<format>   输出格式 (text|json)

示例:
  bun run security:sentinel scan --target="extensions/blog-extension"
  bun run security:sentinel audit --ai-code="console.log('hello')"
  bun run security:sentinel assess --extension="console"
  bun run security:sentinel quarantine --target="suspicious.js"
`)
        process.exit(0)
        break

      default:
        console.error(`❌ 未知操作: ${action}`)
        console.log('运行 "bun run security:sentinel help" 查看可用操作')
        process.exit(1)
    }

    console.log(result.output)
    process.exit(result.success ? 0 : 1)

  } catch (error) {
    console.error('❌ Security Sentinel执行失败:', error.message)
    if (process.env.DEBUG) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()