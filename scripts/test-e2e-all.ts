#!/usr/bin/env bun
/**
 * E2E 测试脚本 - 测试所有应用
 * 先启动各个应用，然后运行E2E测试
 */

import { spawn, ChildProcess } from 'node:child_process'
import { join } from 'node:path'

// 应用配置
const apps = [
  { name: 'starter', port: 3000, dir: 'apps/starter' },
  { name: 'website', port: 3002, dir: 'apps/website' },
  { name: 'demo-app', port: 3001, dir: 'apps/demo-app' },
]

interface ServerProcess {
  name: string
  process: ChildProcess
  port: number
}

const servers: ServerProcess[] = []
let testsPassed = true

// 启动服务器
async function startServer(app: { name: string; port: number; dir: string }): Promise<void> {
  console.log(`🚀 启动 ${app.name} 在端口 ${app.port}...`)

  const serverProcess = spawn('bun', ['run', 'start'], {
    cwd: join(process.cwd(), app.dir),
    env: { ...process.env, PORT: app.port.toString() },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  servers.push({
    name: app.name,
    process: serverProcess,
    port: app.port,
  })

  // 等待服务器启动
  return new Promise((resolve, reject) => {
    let startupTimeout: NodeJS.Timeout | undefined

    const cleanup = () => {
      if (startupTimeout) {
        clearTimeout(startupTimeout)
      }
    }

    serverProcess.stdout?.on('data', data => {
      const output = data.toString()
      if (output.includes('Ready in') || output.includes('started server on')) {
        cleanup()
        console.log(`✅ ${app.name} 已启动在端口 ${app.port}`)
        resolve()
      }
    })

    serverProcess.stderr?.on('data', data => {
      console.error(`❌ ${app.name} 错误:`, data.toString())
    })

    serverProcess.on('error', error => {
      cleanup()
      console.error(`❌ 无法启动 ${app.name}:`, error)
      reject(error)
    })

    // 30秒超时
    startupTimeout = setTimeout(() => {
      cleanup()
      console.log(`⚠️  ${app.name} 启动超时，但继续执行`)
      resolve()
    }, 30000)
  })
}

// 停止所有服务器
function stopAllServers() {
  console.log('\n🛑 停止所有服务器...')
  servers.forEach(({ name, process }) => {
    try {
      process.kill('SIGTERM')
      console.log(`✅ 已停止 ${name}`)
    } catch (error) {
      console.error(`❌ 停止 ${name} 失败:`, error)
    }
  })
}

// 运行E2E测试
async function runE2ETests(): Promise<boolean> {
  console.log('\n🧪 运行 E2E 测试...')

  return new Promise(resolve => {
    const testProcess = spawn('bun', ['playwright', 'test', '--project=chromium'], {
      stdio: 'inherit',
    })

    testProcess.on('close', code => {
      if (code === 0) {
        console.log('✅ 所有 E2E 测试通过')
        resolve(true)
      } else {
        console.error('❌ E2E 测试失败')
        resolve(false)
      }
    })

    testProcess.on('error', error => {
      console.error('❌ 运行 E2E 测试出错:', error)
      resolve(false)
    })
  })
}

// 主要流程
async function main() {
  try {
    console.log('🏗️  准备构建和测试所有应用...\n')

    // 1. 构建所有应用
    console.log('📦 构建所有应用...')
    for (const app of apps) {
      console.log(`构建 ${app.name}...`)
      const buildProcess = spawn('bun', ['run', 'build'], {
        cwd: join(process.cwd(), app.dir),
        stdio: 'inherit',
      })

      const buildSuccess = await new Promise<boolean>(resolve => {
        buildProcess.on('close', code => resolve(code === 0))
        buildProcess.on('error', () => resolve(false))
      })

      if (!buildSuccess) {
        console.error(`❌ 构建 ${app.name} 失败`)
        process.exit(1)
      }
    }

    // 2. 启动所有应用
    console.log('\n🚀 启动所有应用...')
    for (const app of apps) {
      await startServer(app)
      // 给每个服务器一点时间完全启动
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // 等待所有服务器稳定
    console.log('\n⏳ 等待服务器稳定...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 3. 运行E2E测试
    testsPassed = await runE2ETests()
  } catch (error) {
    console.error('❌ 执行过程中出现错误:', error)
    testsPassed = false
  } finally {
    // 清理
    stopAllServers()

    console.log('\n📊 测试结果:')
    if (testsPassed) {
      console.log('✅ 所有测试通过！')
      process.exit(0)
    } else {
      console.log('❌ 测试失败！')
      process.exit(1)
    }
  }
}

// 处理中断信号
process.on('SIGINT', () => {
  console.log('\n\n🛑 接收到中断信号，正在清理...')
  stopAllServers()
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n\n🛑 接收到终止信号，正在清理...')
  stopAllServers()
  process.exit(1)
})

// 启动主流程
main()
