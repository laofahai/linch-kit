/**
 * @ai-context 开发工具命令集合
 * @ai-purpose 提供开发、构建和测试相关的命令
 * @ai-user-experience 简化开发流程的工具命令
 */

import type { CommandMetadata, CLIContext } from '../../types/cli'

/**
 * @ai-function 开发服务器命令处理器
 * @ai-purpose 启动开发服务器，使用现有的 Turborepo 和 Next.js 工具
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleDev(context: CLIContext): Promise<void> {
  const { spawn } = await import('child_process')
  const { args } = context

  console.log('🚀 Starting development server...')

  // AI: 检查是否在项目根目录
  const { existsSync } = await import('fs')
  const { resolve } = await import('path')

  const cwd = process.cwd()
  const packageJsonPath = resolve(cwd, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.error('❌ No package.json found. Please run this command from a project directory.')
    process.exit(1)
  }

  // AI: 读取 package.json 检查项目类型
  const packageJson = JSON.parse(await import('fs').then(fs => fs.readFileSync(packageJsonPath, 'utf-8')))

  let command: string
  let commandArgs: string[] = []

  // AI: 根据项目类型选择合适的开发命令
  if (packageJson.scripts?.dev) {
    // 项目有自定义 dev 脚本
    command = 'npm'
    commandArgs = ['run', 'dev', ...(args || [])]
  } else if (packageJson.dependencies?.['next'] || packageJson.devDependencies?.['next']) {
    // Next.js 项目
    command = 'npx'
    commandArgs = ['next', 'dev', ...(args || [])]
  } else if (existsSync(resolve(cwd, 'turbo.json'))) {
    // Turborepo 项目
    command = 'npx'
    commandArgs = ['turbo', 'dev', ...(args || [])]
  } else {
    console.error('❌ Unable to determine development command for this project.')
    console.log('💡 Please add a "dev" script to your package.json or use Next.js/Turborepo.')
    process.exit(1)
  }

  console.log(`📋 Running: ${command} ${commandArgs.join(' ')}`)

  // AI: 启动开发服务器
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    cwd,
    shell: true
  })

  // AI: 处理进程退出
  child.on('exit', (code) => {
    process.exit(code || 0)
  })

  // AI: 处理中断信号
  process.on('SIGINT', () => {
    child.kill('SIGINT')
  })

  process.on('SIGTERM', () => {
    child.kill('SIGTERM')
  })
}

/**
 * @ai-function 构建命令处理器
 * @ai-purpose 构建生产版本，使用现有的构建工具
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleBuild(context: CLIContext): Promise<void> {
  const { spawn } = await import('child_process')
  const { args } = context

  console.log('🔨 Building for production...')

  // AI: 检查项目配置
  const { existsSync } = await import('fs')
  const { resolve } = await import('path')

  const cwd = process.cwd()
  const packageJsonPath = resolve(cwd, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.error('❌ No package.json found. Please run this command from a project directory.')
    process.exit(1)
  }

  const packageJson = JSON.parse(await import('fs').then(fs => fs.readFileSync(packageJsonPath, 'utf-8')))

  let command: string
  let commandArgs: string[] = []

  // AI: 根据项目类型选择构建命令
  if (packageJson.scripts?.build) {
    // 项目有自定义 build 脚本
    command = 'npm'
    commandArgs = ['run', 'build', ...(args || [])]
  } else if (packageJson.dependencies?.['next'] || packageJson.devDependencies?.['next']) {
    // Next.js 项目
    command = 'npx'
    commandArgs = ['next', 'build', ...(args || [])]
  } else if (existsSync(resolve(cwd, 'turbo.json'))) {
    // Turborepo 项目
    command = 'npx'
    commandArgs = ['turbo', 'build', ...(args || [])]
  } else {
    console.error('❌ Unable to determine build command for this project.')
    console.log('💡 Please add a "build" script to your package.json.')
    process.exit(1)
  }

  console.log(`📋 Running: ${command} ${commandArgs.join(' ')}`)

  // AI: 执行构建
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    cwd,
    shell: true
  })

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✅ Build completed successfully!')
    } else {
      console.error('\n❌ Build failed!')
      process.exit(code || 1)
    }
  })
}

/**
 * @ai-function 测试命令处理器
 * @ai-purpose 运行测试套件，使用现有的测试工具
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleTest(context: CLIContext): Promise<void> {
  const { spawn } = await import('child_process')
  const { args } = context

  console.log('🧪 Running tests...')

  // AI: 检查项目配置
  const { existsSync } = await import('fs')
  const { resolve } = await import('path')

  const cwd = process.cwd()
  const packageJsonPath = resolve(cwd, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.error('❌ No package.json found. Please run this command from a project directory.')
    process.exit(1)
  }

  const packageJson = JSON.parse(await import('fs').then(fs => fs.readFileSync(packageJsonPath, 'utf-8')))

  let command: string
  let commandArgs: string[] = []

  // AI: 根据项目配置选择测试命令
  if (packageJson.scripts?.test) {
    // 项目有自定义 test 脚本
    command = 'npm'
    commandArgs = ['run', 'test', ...(args || [])]
  } else if (packageJson.devDependencies?.['jest'] || packageJson.dependencies?.['jest']) {
    // Jest 项目
    command = 'npx'
    commandArgs = ['jest', ...(args || [])]
  } else if (packageJson.devDependencies?.['vitest'] || packageJson.dependencies?.['vitest']) {
    // Vitest 项目
    command = 'npx'
    commandArgs = ['vitest', 'run', ...(args || [])]
  } else if (existsSync(resolve(cwd, 'turbo.json'))) {
    // Turborepo 项目
    command = 'npx'
    commandArgs = ['turbo', 'test', ...(args || [])]
  } else {
    console.error('❌ No test framework detected.')
    console.log('💡 Please install Jest, Vitest, or add a "test" script to your package.json.')
    process.exit(1)
  }

  console.log(`📋 Running: ${command} ${commandArgs.join(' ')}`)

  // AI: 执行测试
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    cwd,
    shell: true
  })

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!')
    } else {
      console.error('\n❌ Some tests failed!')
      process.exit(code || 1)
    }
  })
}

/**
 * @ai-export 开发工具命令集合
 * @ai-purpose 导出所有开发相关命令
 */
export const devCommands = {
  dev: {
    description: 'Start development server (delegates to npm run dev, Next.js, or Turborepo)',
    handler: handleDev,
    arguments: [
      {
        name: 'args',
        description: 'Additional arguments to pass to the dev command',
        required: false
      }
    ],
    examples: [
      'linch dev',
      'linch dev --port 4000',
      'linch dev --turbo'
    ],
    category: 'dev',
    aiTags: ['development', 'server', 'proxy', 'delegation']
  } as CommandMetadata,

  build: {
    description: 'Build for production (delegates to npm run build, Next.js, or Turborepo)',
    handler: handleBuild,
    arguments: [
      {
        name: 'args',
        description: 'Additional arguments to pass to the build command',
        required: false
      }
    ],
    examples: [
      'linch build',
      'linch build --analyze',
      'linch build --no-lint'
    ],
    category: 'dev',
    aiTags: ['build', 'production', 'proxy', 'delegation']
  } as CommandMetadata,

  test: {
    description: 'Run tests (delegates to npm run test, Jest, Vitest, or Turborepo)',
    handler: handleTest,
    arguments: [
      {
        name: 'args',
        description: 'Additional arguments to pass to the test command',
        required: false
      }
    ],
    examples: [
      'linch test',
      'linch test auth',
      'linch test --watch --coverage'
    ],
    category: 'dev',
    aiTags: ['testing', 'proxy', 'delegation']
  } as CommandMetadata
}
