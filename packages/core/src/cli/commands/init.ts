/**
 * @ai-context 项目初始化命令
 * @ai-purpose 创建新的 Linch Kit 项目，设置基础结构和配置
 * @ai-user-experience 交互式引导用户完成项目初始化
 * @ai-templates 支持多种项目模板选择
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'
import type { CommandMetadata, CLIContext } from '../../types/cli'

/**
 * @ai-interface 项目初始化选项
 * @ai-purpose 定义项目初始化的配置选项
 */
interface InitOptions {
  /** @ai-field 项目名称 */
  name: string
  
  /** @ai-field 项目模板类型 */
  template: 'basic' | 'enterprise' | 'plugin'
  
  /** @ai-field 是否使用 TypeScript */
  typescript: boolean
  
  /** @ai-field 数据库提供商 */
  database: 'postgresql' | 'mysql' | 'sqlite'
  
  /** @ai-field 是否包含认证功能 */
  auth: boolean
  
  /** @ai-field 是否强制覆盖现有文件 */
  force: boolean
  
  /** @ai-field 目标目录 */
  directory: string
}

/**
 * @ai-function 项目初始化命令处理器
 * @ai-purpose 执行项目初始化流程
 * @ai-interactive 提供交互式配置选择
 * @ai-validation 验证项目名称和目录
 * @ai-templates 根据模板生成项目结构
 */
async function handleInit(context: CLIContext): Promise<void> {
  const { args } = context
  const projectName = args?.[0] as string
  
  console.log('🚀 Welcome to Linch Kit!')
  console.log('AI-First rapid development framework\n')

  // AI: 获取项目配置
  const options = await getInitOptions(projectName, context)
  
  // AI: 验证项目设置
  await validateProjectSetup(options)
  
  // AI: 创建项目结构
  await createProjectStructure(options)
  
  // AI: 配置文件已在 createProjectStructure 中生成
  console.log('✅ Configuration files generated')
  
  // AI: 安装依赖（可选）
  await installDependencies(options)
  
  // AI: 显示完成信息
  showCompletionMessage(options)
}

/**
 * @ai-function 获取初始化选项
 * @ai-purpose 通过交互式提示收集项目配置
 * @ai-parameter projectName?: string - 可选的项目名称
 * @ai-parameter context: CLIContext - CLI 上下文
 * @ai-return Promise<InitOptions> - 初始化选项
 * @ai-interactive 使用 inquirer 进行交互式配置
 */
async function getInitOptions(projectName?: string, context?: CLIContext): Promise<InitOptions> {
  // AI: 模拟交互式输入（实际实现需要 inquirer）
  const options: InitOptions = {
    name: projectName || 'my-linch-app',
    template: 'basic',
    typescript: true,
    database: 'postgresql',
    auth: true,
    force: false,
    directory: resolve(process.cwd(), projectName || 'my-linch-app')
  }

  // AI: 这里应该使用 inquirer 进行交互式配置
  // 为了简化，暂时使用默认值
  console.log(`📝 Project configuration:`)
  console.log(`   Name: ${options.name}`)
  console.log(`   Template: ${options.template}`)
  console.log(`   TypeScript: ${options.typescript ? 'Yes' : 'No'}`)
  console.log(`   Database: ${options.database}`)
  console.log(`   Auth: ${options.auth ? 'Yes' : 'No'}`)
  console.log(`   Directory: ${options.directory}\n`)

  return options
}

/**
 * @ai-function 验证项目设置
 * @ai-purpose 检查项目名称和目录的有效性
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-validation 验证项目名称格式、目录权限等
 * @ai-error-handling 验证失败时提供清晰的错误信息
 */
async function validateProjectSetup(options: InitOptions): Promise<void> {
  // AI: 验证项目名称
  if (!/^[a-z][a-z0-9-]*$/.test(options.name)) {
    throw new Error('AI: Project name must be lowercase and contain only letters, numbers, and hyphens')
  }

  // AI: 检查目录是否存在
  if (existsSync(options.directory)) {
    if (!options.force) {
      throw new Error(`AI: Directory '${options.directory}' already exists. Use --force to overwrite.`)
    }
    console.log(`⚠️  Directory exists, will overwrite due to --force flag`)
  }

  console.log('✅ Project setup validation passed')
}

/**
 * @ai-function 创建项目结构
 * @ai-purpose 根据模板创建项目目录和基础文件
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-templates 支持不同的项目模板
 * @ai-file-generation 生成标准的项目结构
 */
async function createProjectStructure(options: InitOptions): Promise<void> {
  console.log('📁 Creating project structure...')

  const { directory, template } = options

  // AI: 创建根目录
  mkdirSync(directory, { recursive: true })

  // AI: 根据模板创建目录结构
  const directories = getTemplateDirectories(template)
  directories.forEach(dir => {
    const fullPath = join(directory, dir)
    mkdirSync(fullPath, { recursive: true })
    console.log(`   Created: ${dir}`)
  })

  // AI: 创建基础文件
  const files = getTemplateFiles(template, options)
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = join(directory, filePath)
    writeFileSync(fullPath, content, 'utf-8')
    console.log(`   Created: ${filePath}`)
  })

  console.log('✅ Project structure created')
}

/**
 * @ai-function 获取模板目录结构
 * @ai-purpose 根据模板类型返回需要创建的目录列表
 * @ai-parameter template: string - 模板类型
 * @ai-return string[] - 目录路径列表
 */
function getTemplateDirectories(template: string): string[] {
  const baseDirectories = [
    'src',
    'src/entities',
    'src/lib',
    'src/utils',
    'docs',
    'tests'
  ]

  const templateDirectories: Record<string, string[]> = {
    basic: [
      ...baseDirectories,
      'src/pages',
      'src/components'
    ],
    enterprise: [
      ...baseDirectories,
      'src/pages',
      'src/components',
      'src/middleware',
      'src/services',
      'src/workflows',
      'prisma',
      'public'
    ],
    plugin: [
      'src',
      'src/commands',
      'src/types',
      'src/utils',
      'docs',
      'tests',
      'examples'
    ]
  }

  return templateDirectories[template] || baseDirectories
}

/**
 * @ai-function 获取模板文件内容
 * @ai-purpose 根据模板和选项生成文件内容
 * @ai-parameter template: string - 模板类型
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return Record<string, string> - 文件路径到内容的映射
 */
function getTemplateFiles(template: string, options: InitOptions): Record<string, string> {
  const files: Record<string, string> = {}

  // AI: 基础文件
  files['package.json'] = generatePackageJson(options)
  files['README.md'] = generateReadme(options)
  files[options.typescript ? 'linch.config.ts' : 'linch.config.js'] = generateLinchConfig(options)
  files['.gitignore'] = generateGitignore()

  if (options.typescript) {
    files['tsconfig.json'] = generateTsConfig()
  }

  // AI: 模板特定文件
  if (template === 'enterprise') {
    files['prisma/schema.prisma'] = generatePrismaSchema(options)
    files['.env.example'] = generateEnvExample(options)
  }

  if (template === 'plugin') {
    files['src/index.ts'] = generatePluginIndex(options)
    files['src/commands/example.ts'] = generateExampleCommand(options)
  }

  return files
}

/**
 * @ai-function 生成 package.json
 * @ai-purpose 创建项目的 package.json 文件
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - package.json 内容
 */
function generatePackageJson(options: InitOptions): string {
  const packageJson: any = {
    name: options.name,
    version: '0.1.0',
    description: `AI-First application built with Linch Kit`,
    main: options.typescript ? 'dist/index.js' : 'src/index.js',
    scripts: {
      dev: 'linch dev',
      build: 'linch build',
      start: 'node dist/index.js',
      test: 'linch test',
      'schema:generate': 'linch schema:generate'
    },
    dependencies: {
      '@linch-kit/core': '^0.1.0',
      '@linch-kit/schema': '^0.1.0'
    },
    devDependencies: {
      '@linch-kit/cli': '^0.1.0'
    },
    keywords: ['linch-kit', 'ai-first', 'rapid-development'],
    author: '',
    license: 'MIT'
  }

  if (options.typescript) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      typescript: '^5.0.0',
      '@types/node': '^20.0.0'
    }
  }

  if (options.auth) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@linch-kit/auth-core': '^0.1.0'
    }
  }

  return JSON.stringify(packageJson, null, 2)
}

/**
 * @ai-function 生成 README.md
 * @ai-purpose 创建项目说明文档
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - README 内容
 */
function generateReadme(options: InitOptions): string {
  return `# ${options.name}

AI-First application built with Linch Kit.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## 📚 Documentation

- [Linch Kit Documentation](https://linch-kit.dev)
- [AI-First Development Guide](https://linch-kit.dev/ai-first)

## 🤖 AI Features

This project is built with AI-First principles:
- All code is optimized for AI understanding
- Automatic code generation and validation
- Intelligent error handling and suggestions

## 📦 Project Structure

\`\`\`
${options.name}/
├── src/                 # Source code
├── docs/                # Documentation
├── tests/               # Test files
└── linch-kit.config.js  # Linch Kit configuration
\`\`\`

## 🛠️ Development

Built with:
- **Framework**: Linch Kit (AI-First)
- **Language**: ${options.typescript ? 'TypeScript' : 'JavaScript'}
- **Database**: ${options.database}
${options.auth ? '- **Auth**: Included' : ''}

## 📄 License

MIT
`
}

/**
 * @ai-function 生成 Linch Kit 配置文件
 * @ai-purpose 创建项目的主配置文件
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - 配置文件内容
 */
function generateLinchConfig(options: InitOptions): string {
  if (options.typescript) {
    return `import type { LinchConfig } from '@linch-kit/core'

const config: LinchConfig = {
  // 项目基本信息
  project: {
    name: '${options.name}',
    version: '0.1.0',
    description: 'AI-First application built with Linch Kit',
    author: '',
  },

  // 数据库配置
  database: {
    type: '${options.database}',
    url: process.env.DATABASE_URL || '${getDatabaseUrl(options.database, options.name)}',
  },

  // Schema 配置
  schema: {
    entities: ['src/entities/**/*.{ts,tsx,js}'],
    output: {
      prisma: './prisma/schema.prisma',
      validators: './src/validators/generated.ts',
      mocks: './src/mocks/factories.ts',
      openapi: './docs/api.json',
    },
    database: {
      provider: '${options.database}',
      url: process.env.DATABASE_URL || '${getDatabaseUrl(options.database, options.name)}',
    },
    // 启用软删除
    softDelete: true,
  },

  ${options.auth ? `// Auth 配置
  auth: {
    userEntity: 'basic',
    providers: [
      {
        type: 'credentials',
        id: 'credentials',
        config: {
          name: 'credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
        },
      },
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: false,
      multiTenant: false,
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
  },

  // tRPC 配置
  trpc: {
    endpoint: '/api/trpc',
    enableSubscriptions: false,
    enableBatching: true,
    maxBatchSize: 10,
  },` : ''}

  // 插件配置
  plugins: ['@linch-kit/schema'${options.auth ? ", '@linch-kit/auth-core'" : ''}],
}

export default config`
  } else {
    return `// Linch Kit Configuration
// AI-First rapid development framework

export default {
  // Project information
  project: {
    name: '${options.name}',
    version: '0.1.0',
    description: 'AI-First application built with Linch Kit'
  },

  // Database configuration
  database: {
    type: '${options.database}',
    url: process.env.DATABASE_URL || '${getDatabaseUrl(options.database, options.name)}'
  },

  // Schema configuration
  schema: {
    entities: ['src/entities/**/*.{ts,js}'],
    output: {
      prisma: './prisma/schema.prisma',
      validators: './src/lib/validators.js'
    },
    softDelete: true
  },

  ${options.auth ? `// Authentication configuration
  auth: {
    userEntity: 'basic',
    providers: [{ type: 'credentials', id: 'credentials', config: {} }],
    permissions: { strategy: 'rbac', hierarchical: false, multiTenant: false },
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }
  },` : ''}

  // Plugin configuration
  plugins: ['@linch-kit/schema'${options.auth ? ", '@linch-kit/auth-core'" : ''}]
}
`
  }
}

/**
 * 根据数据库类型生成默认连接URL
 */
function getDatabaseUrl(database: string, projectName: string): string {
  switch (database) {
    case 'postgresql':
      return `postgresql://username:password@localhost:5432/${projectName}`
    case 'mysql':
      return `mysql://username:password@localhost:3306/${projectName}`
    case 'sqlite':
      return `file:./${projectName}.db`
    default:
      return `${database}://localhost/${projectName}`
  }
}

/**
 * @ai-function 生成 .gitignore 文件
 * @ai-purpose 创建 Git 忽略文件
 * @ai-return string - .gitignore 内容
 */
function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
dist/
build/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Linch Kit specific
.linch-cache/
`
}

/**
 * @ai-function 生成 TypeScript 配置
 * @ai-purpose 创建 TypeScript 配置文件
 * @ai-return string - tsconfig.json 内容
 */
function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next'
        }
      ],
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  }, null, 2)
}

/**
 * @ai-function 生成环境变量示例文件
 * @ai-purpose 创建环境变量模板
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - .env.example 内容
 */
function generateEnvExample(options: InitOptions): string {
  let content = `# Database
DATABASE_URL="${options.database}://username:password@localhost:5432/${options.name}"

# Application
NODE_ENV=development
PORT=3000

# Linch Kit
LINCH_LOG_LEVEL=info
`

  if (options.auth) {
    content += `
# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
`
  }

  return content
}

/**
 * @ai-function 生成 Prisma Schema
 * @ai-purpose 创建基础的 Prisma schema 文件
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - Prisma schema 内容
 */
function generatePrismaSchema(options: InitOptions): string {
  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${options.database}"
  url      = env("DATABASE_URL")
}

// Generated by Linch Kit Schema System
// Run 'linch schema:generate' to regenerate

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
`
}

/**
 * @ai-function 生成插件入口文件
 * @ai-purpose 为插件模板创建入口文件
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - 插件入口文件内容
 */
function generatePluginIndex(options: InitOptions): string {
  return `/**
 * @ai-context ${options.name} Linch Kit Plugin
 * @ai-purpose Custom CLI plugin for Linch Kit
 */

import type { CommandPlugin } from '@linch-kit/cli'
import { exampleCommand } from './commands/example'

const plugin: CommandPlugin = {
  name: '${options.name}',
  version: '0.1.0',
  description: 'Custom Linch Kit plugin',
  
  async register(registry) {
    registry.registerCommand('example', exampleCommand)
  }
}

export default plugin
`
}

/**
 * @ai-function 生成示例命令
 * @ai-purpose 为插件模板创建示例命令
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-return string - 示例命令内容
 */
function generateExampleCommand(options: InitOptions): string {
  return `/**
 * @ai-context Example command for ${options.name} plugin
 * @ai-purpose Demonstrate how to create custom CLI commands
 */

import type { CommandMetadata } from '@linch-kit/cli'

export const exampleCommand: CommandMetadata = {
  description: 'Example command from ${options.name} plugin',
  
  async handler(context) {
    console.log('Hello from ${options.name} plugin!')
    console.log('Context:', context)
  },
  
  options: [
    {
      flags: '-m, --message <message>',
      description: 'Custom message to display'
    }
  ],
  
  examples: [
    'linch example',
    'linch example --message "Hello World"'
  ],
  
  aiTags: ['example', 'plugin', 'demo']
}
`
}

/**
 * @ai-function 安装依赖
 * @ai-purpose 可选地安装项目依赖
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-interactive 询问用户是否安装依赖
 */
async function installDependencies(options: InitOptions): Promise<void> {
  // AI: 这里可以实现依赖安装逻辑
  console.log('📦 Dependencies defined in package.json')
  console.log('   Run "npm install" to install dependencies')
}

/**
 * @ai-function 显示完成信息
 * @ai-purpose 显示项目创建完成的信息和下一步指导
 * @ai-parameter options: InitOptions - 初始化选项
 * @ai-user-experience 提供清晰的下一步指导
 */
function showCompletionMessage(options: InitOptions): void {
  console.log('\n🎉 Project created successfully!')
  console.log('\n📋 Next steps:')
  console.log(`   cd ${options.name}`)
  console.log('   npm install')
  console.log('   npm run dev')
  console.log('\n📚 Learn more:')
  console.log('   https://linch-kit.dev/docs')
  console.log('   https://linch-kit.dev/ai-first')
  console.log('\n🤖 AI-First features enabled!')
}

/**
 * @ai-export 项目初始化命令元数据
 * @ai-purpose 导出完整的命令定义
 */
export const initCommand: CommandMetadata = {
  description: 'Initialize a new Linch Kit project',
  handler: handleInit,
  
  arguments: [
    {
      name: 'project-name',
      description: 'Name of the project to create',
      required: false
    }
  ],
  
  options: [
    {
      flags: '-t, --template <template>',
      description: 'Project template (basic, enterprise, plugin)',
      defaultValue: 'basic'
    },
    {
      flags: '--no-typescript',
      description: 'Use JavaScript instead of TypeScript'
    },
    {
      flags: '-d, --database <database>',
      description: 'Database provider (postgresql, mysql, sqlite)',
      defaultValue: 'postgresql'
    },
    {
      flags: '--no-auth',
      description: 'Skip authentication setup'
    },
    {
      flags: '-f, --force',
      description: 'Overwrite existing files'
    }
  ],
  
  examples: [
    'linch init my-app',
    'linch init my-app --template enterprise',
    'linch init my-plugin --template plugin',
    'linch init my-app --database mysql --no-auth'
  ],
  
  category: 'project',
  aiTags: ['initialization', 'project-setup', 'scaffolding', 'templates']
}
