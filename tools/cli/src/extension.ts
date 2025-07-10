/**
 * Extension开发支持命令
 * @module extension
 */

import path from 'path'
import { execSync } from 'child_process'

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import prompts from 'prompts'
import fs from 'fs-extra'

/**
 * Extension模板配置
 */
interface ExtensionTemplate {
  name: string
  description: string
  capabilities: string[]
  dependencies: string[]
}

/**
 * Extension创建选项
 */
interface ExtensionCreateOptions {
  template?: string
  install?: boolean
  capabilities?: string[]
  output?: string
}

/**
 * Extension安装选项
 */
interface ExtensionInstallOptions {
  source?: string
  version?: string
  registry?: string
}

/**
 * 可用的Extension模板
 */
const EXTENSION_TEMPLATES: Record<string, ExtensionTemplate> = {
  basic: {
    name: 'Basic Extension',
    description: '基础Extension模板，包含Schema定义和基础生命周期',
    capabilities: ['schema'],
    dependencies: ['@linch-kit/core', '@linch-kit/platform'],
  },
  fullstack: {
    name: 'Full-Stack Extension',
    description: '全栈Extension模板，包含Schema、API、UI和Hooks',
    capabilities: ['schema', 'api', 'ui', 'hooks'],
    dependencies: ['@linch-kit/core', '@linch-kit/platform', '@linch-kit/ui'],
  },
  blog: {
    name: 'Blog Extension',
    description: '博客功能Extension，完整的示例实现',
    capabilities: ['schema', 'api', 'ui', 'hooks'],
    dependencies: ['@linch-kit/core', '@linch-kit/platform', '@linch-kit/ui'],
  },
}

/**
 * 创建Extension命令
 */
async function createExtension(extensionName: string, options: ExtensionCreateOptions = {}) {
  console.log(`\\n🚀 创建Extension: ${chalk.cyan(extensionName)}\\n`)

  // 获取模板选择
  const template = options.template || await selectTemplate()
  const templateConfig = EXTENSION_TEMPLATES[template]

  if (!templateConfig) {
    console.error(chalk.red(`❌ 未知的模板: ${template}`))
    process.exit(1)
  }

  // 获取输出目录
  const outputDir = options.output || path.join(process.cwd(), 'extensions', extensionName)
  
  // 检查目录是否存在
  if (fs.existsSync(outputDir)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `目录 ${chalk.cyan(outputDir)} 已存在，是否覆盖?`,
      initial: false,
    })

    if (!overwrite) {
      console.log(chalk.yellow('操作已取消'))
      process.exit(0)
    }

    await fs.remove(outputDir)
  }

  // 创建Extension目录结构
  await createExtensionStructure(outputDir, extensionName, templateConfig)

  // 安装依赖
  if (options.install !== false) {
    await installExtensionDependencies(outputDir)
  }

  // 成功提示
  console.log(`\\n${chalk.green('✅ Extension创建成功!')}\\n`)
  console.log(`进入Extension目录：`)
  console.log(`  ${chalk.cyan(`cd ${path.relative(process.cwd(), outputDir)}`)}\\n`)
  
  if (options.install === false) {
    console.log('安装依赖：')
    console.log(`  ${chalk.cyan('bun install')}\\n`)
  }
  
  console.log('开发模式：')
  console.log(`  ${chalk.cyan('bun dev')}\\n`)
  
  console.log('构建Extension：')
  console.log(`  ${chalk.cyan('bun build')}\\n`)
}

/**
 * 安装Extension命令
 */
async function installExtension(extensionName: string, options: ExtensionInstallOptions = {}) {
  console.log(`\\n📦 安装Extension: ${chalk.cyan(extensionName)}\\n`)

  const spinner = ora('正在安装Extension...').start()

  try {
    // 检查Extension是否已存在
    const extensionPath = path.join(process.cwd(), 'extensions', extensionName)
    if (fs.existsSync(extensionPath)) {
      spinner.fail(`Extension ${extensionName} 已存在`)
      return
    }

    // 根据来源安装Extension
    if (options.source) {
      await installFromSource(extensionName, options.source, extensionPath)
    } else {
      await installFromRegistry(extensionName, options.registry || 'npm', extensionPath)
    }

    spinner.succeed(`Extension ${extensionName} 安装成功`)
  } catch (error) {
    spinner.fail('Extension安装失败')
    console.error(chalk.red('错误:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

/**
 * 列出Extension命令
 */
async function listExtensions() {
  console.log(`\\n📋 已安装的Extension:\\n`)

  const extensionsDir = path.join(process.cwd(), 'extensions')
  
  if (!fs.existsSync(extensionsDir)) {
    console.log(chalk.yellow('未找到extensions目录'))
    return
  }

  const extensions = fs.readdirSync(extensionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  if (extensions.length === 0) {
    console.log(chalk.yellow('没有已安装的Extension'))
    return
  }

  for (const extensionName of extensions) {
    const extensionPath = path.join(extensionsDir, extensionName)
    const packageJsonPath = path.join(extensionPath, 'package.json')
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath)
      const linchkitConfig = packageJson.linchkit || {}
      
      console.log(`${chalk.cyan(extensionName)} ${chalk.gray(`v${packageJson.version}`)}`)
      console.log(`  ${packageJson.description || '无描述'}`)
      
      if (linchkitConfig.capabilities) {
        const capabilities = Object.keys(linchkitConfig.capabilities)
          .filter(cap => linchkitConfig.capabilities[cap])
          .join(', ')
        console.log(`  📊 能力: ${chalk.green(capabilities)}`)
      }
      
      console.log('')
    }
  }
}

/**
 * 开发Extension命令
 */
async function devExtension(extensionName?: string) {
  if (!extensionName) {
    // 自动检测当前目录的Extension
    const currentDir = process.cwd()
    const packageJsonPath = path.join(currentDir, 'package.json')
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath)
      if (packageJson.linchkit) {
        extensionName = packageJson.name
      }
    }
    
    if (!extensionName) {
      console.error(chalk.red('❌ 请指定Extension名称或在Extension目录中运行'))
      process.exit(1)
    }
  }

  console.log(`\\n🔥 开发模式启动: ${chalk.cyan(extensionName)}\\n`)

  const spinner = ora('启动热重载...').start()

  try {
    // 启动Extension热重载
    const extensionPath = path.join(process.cwd(), 'extensions', extensionName)
    
    if (!fs.existsSync(extensionPath)) {
      spinner.fail(`Extension ${extensionName} 不存在`)
      return
    }

    // 启动开发服务器
    execSync('bun dev', { cwd: extensionPath, stdio: 'inherit' })
    
    spinner.succeed('热重载启动成功')
  } catch (error) {
    spinner.fail('热重载启动失败')
    console.error(chalk.red('错误:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

/**
 * 选择模板
 */
async function selectTemplate(): Promise<string> {
  const response = await prompts({
    type: 'select',
    name: 'template',
    message: '选择Extension模板:',
    choices: Object.entries(EXTENSION_TEMPLATES).map(([key, template]) => ({
      title: template.name,
      description: template.description,
      value: key,
    })),
  })

  return response.template
}

/**
 * 创建Extension目录结构
 */
async function createExtensionStructure(
  outputDir: string,
  extensionName: string,
  templateConfig: ExtensionTemplate
) {
  const spinner = ora('创建Extension结构...').start()

  try {
    // 创建基础目录
    await fs.ensureDir(outputDir)
    await fs.ensureDir(path.join(outputDir, 'src'))
    await fs.ensureDir(path.join(outputDir, 'dist'))
    await fs.ensureDir(path.join(outputDir, 'docs'))

    // 创建package.json
    const packageJson = {
      name: extensionName,
      version: '0.1.0',
      description: `LinchKit Extension - ${extensionName}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        dev: 'tsup --watch',
        build: 'tsup',
        'type-check': 'tsc --noEmit',
        lint: 'eslint src/',
        'lint:fix': 'eslint src/ --fix',
        test: 'bun test',
        clean: 'rm -rf dist',
      },
      dependencies: templateConfig.dependencies.reduce((acc, dep) => {
        acc[dep] = 'workspace:*'
        return acc
      }, {} as Record<string, string>),
      devDependencies: {
        '@types/node': '^22.0.0',
        eslint: '^9.0.0',
        tsup: '^8.3.5',
        typescript: '^5.8.3',
      },
      linchkit: {
        displayName: templateConfig.name,
        category: 'custom',
        capabilities: templateConfig.capabilities.reduce((acc, cap) => {
          acc[`has${cap.charAt(0).toUpperCase() + cap.slice(1)}`] = true
          return acc
        }, {} as Record<string, boolean>),
        permissions: ['database:read', 'database:write', 'api:read', 'api:write', 'ui:render'],
        entries: {
          schema: templateConfig.capabilities.includes('schema') ? 'schema.ts' : undefined,
          api: templateConfig.capabilities.includes('api') ? 'api.ts' : undefined,
          components: templateConfig.capabilities.includes('ui') ? 'components.ts' : undefined,
          hooks: templateConfig.capabilities.includes('hooks') ? 'hooks.ts' : undefined,
        },
        dependencies: templateConfig.dependencies,
      },
    }

    await fs.writeJson(path.join(outputDir, 'package.json'), packageJson, { spaces: 2 })

    // 创建tsconfig.json
    const tsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: 'dist',
        rootDir: 'src',
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ['src/**/*'],
      exclude: ['dist', 'node_modules', '**/*.test.ts'],
    }

    await fs.writeJson(path.join(outputDir, 'tsconfig.json'), tsConfig, { spaces: 2 })

    // 创建tsup配置
    const tsupConfig = `import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', '@linch-kit/core', '@linch-kit/schema'],
})`

    await fs.writeFile(path.join(outputDir, 'tsup.config.ts'), tsupConfig)

    // 创建主入口文件
    const mainIndexContent = await generateMainIndex(extensionName, templateConfig)
    await fs.writeFile(path.join(outputDir, 'src/index.ts'), mainIndexContent)

    // 创建能力文件
    for (const capability of templateConfig.capabilities) {
      const capabilityContent = await generateCapabilityFile(capability, extensionName)
      await fs.writeFile(path.join(outputDir, `src/${capability}.ts`), capabilityContent)
    }

    // 创建README.md
    const readmeContent = await generateReadme(extensionName, templateConfig)
    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent)

    spinner.succeed('Extension结构创建完成')
  } catch (error) {
    spinner.fail('Extension结构创建失败')
    throw error
  }
}

/**
 * 安装Extension依赖
 */
async function installExtensionDependencies(extensionPath: string) {
  const spinner = ora('安装Extension依赖...').start()

  try {
    execSync('bun install', { cwd: extensionPath, stdio: 'ignore' })
    spinner.succeed('Extension依赖安装完成')
  } catch {
    spinner.fail('Extension依赖安装失败')
    console.log(chalk.yellow('请手动运行 bun install 安装依赖'))
  }
}

/**
 * 从源码安装Extension
 */
async function installFromSource(extensionName: string, source: string, targetPath: string) {
  // 这里可以支持Git仓库、本地路径等
  // 暂时简化实现
  console.log(`从源码安装: ${source} -> ${targetPath}`)
}

/**
 * 从registry安装Extension
 */
async function installFromRegistry(extensionName: string, registry: string, targetPath: string) {
  // 这里可以支持从npm registry或自定义registry安装
  // 暂时简化实现
  console.log(`从registry安装: ${registry}/${extensionName} -> ${targetPath}`)
}

/**
 * 生成主入口文件
 */
async function generateMainIndex(extensionName: string, templateConfig: ExtensionTemplate): Promise<string> {
  const imports = []
  const exports = []

  if (templateConfig.capabilities.includes('schema')) {
    imports.push("import { schema } from './schema'")
    exports.push('schema')
  }

  if (templateConfig.capabilities.includes('api')) {
    imports.push("import { api } from './api'")
    exports.push('api')
  }

  if (templateConfig.capabilities.includes('ui')) {
    imports.push("import { components } from './components'")
    exports.push('components')
  }

  if (templateConfig.capabilities.includes('hooks')) {
    imports.push("import { hooks } from './hooks'")
    exports.push('hooks')
  }

  return `/**
 * ${extensionName} Extension
 * Generated by LinchKit CLI
 */

import type { Extension } from '@linch-kit/core/extension'

${imports.join('\\n')}

/**
 * Extension配置
 */
export const metadata = {
  id: '${extensionName}',
  name: '${templateConfig.name}',
  version: '0.1.0',
  description: '${templateConfig.description}',
  displayName: '${templateConfig.name}',
  category: 'custom',
  capabilities: {
    ${templateConfig.capabilities.map(cap => `has${cap.charAt(0).toUpperCase() + cap.slice(1)}: true`).join(',\\n    ')}
  },
  permissions: ['database:read', 'database:write', 'api:read', 'api:write', 'ui:render'],
  entries: {
    ${templateConfig.capabilities.includes('schema') ? "schema: 'schema.ts'," : ''}
    ${templateConfig.capabilities.includes('api') ? "api: 'api.ts'," : ''}
    ${templateConfig.capabilities.includes('ui') ? "components: 'components.ts'," : ''}
    ${templateConfig.capabilities.includes('hooks') ? "hooks: 'hooks.ts'," : ''}
  },
  dependencies: [${templateConfig.dependencies.map(dep => `'${dep}'`).join(', ')}],
} as const

/**
 * Extension实现
 */
const extension: Extension = {
  metadata,
  
  async init(config) {
    console.log(\`\${metadata.name} Extension initialized\`, config)
  },
  
  async start(config) {
    console.log(\`\${metadata.name} Extension started\`, config)
  },
  
  async stop(config) {
    console.log(\`\${metadata.name} Extension stopped\`, config)
  },
  
  async destroy(config) {
    console.log(\`\${metadata.name} Extension destroyed\`, config)
  },
}

export default extension

// 导出能力
${exports.map(exp => `export { ${exp} }`).join('\\n')}
`
}

/**
 * 生成能力文件
 */
async function generateCapabilityFile(capability: string, extensionName: string): Promise<string> {
  switch (capability) {
    case 'schema':
      return generateSchemaFile(extensionName)
    case 'api':
      return generateApiFile(extensionName)
    case 'ui':
      return generateUIFile(extensionName)
    case 'hooks':
      return generateHooksFile(extensionName)
    default:
      return `// ${capability} capability for ${extensionName}`
  }
}

/**
 * 生成Schema文件
 */
function generateSchemaFile(extensionName: string): string {
  return `/**
 * ${extensionName} Schema定义
 */

import { defineEntity } from '@linch-kit/platform'
import { z } from 'zod'

/**
 * 示例实体Schema
 */
export const ExampleEntity = defineEntity({
  name: '${extensionName}Example',
  schema: z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    content: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: '${extensionName.toLowerCase()}_examples',
  },
})

export const schema = {
  entities: [ExampleEntity],
}
`
}

/**
 * 生成API文件
 */
function generateApiFile(extensionName: string): string {
  return `/**
 * ${extensionName} API路由
 */

import { router } from '@linch-kit/platform/trpc'
import { createCRUD } from '@linch-kit/platform/crud'
import { ExampleEntity } from './schema'

/**
 * 创建CRUD路由
 */
const exampleCRUD = createCRUD(ExampleEntity)

/**
 * Extension API路由
 */
export const api = router({
  example: exampleCRUD.router,
  
  // 自定义API端点
  hello: router({
    world: publicProcedure
      .query(() => {
        return { message: 'Hello from ${extensionName} Extension!' }
      }),
  }),
})
`
}

/**
 * 生成UI文件
 */
function generateUIFile(extensionName: string): string {
  return `/**
 * ${extensionName} UI组件
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/client'

/**
 * 示例组件
 */
export function ExampleComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>${extensionName} Extension</CardTitle>
        <CardDescription>
          这是一个由LinchKit CLI生成的Extension组件
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Extension功能正常运行中...</p>
        <Button onClick={() => alert('Hello from ${extensionName}!')}>
          点击测试
        </Button>
      </CardContent>
    </Card>
  )
}

export const components = {
  ExampleComponent,
}
`
}

/**
 * 生成Hooks文件
 */
function generateHooksFile(extensionName: string): string {
  return `/**
 * ${extensionName} Hooks
 */

import { useEffect } from 'react'
import type { HookContext } from '@linch-kit/core/extension'

/**
 * Extension初始化Hook
 */
export function useExtensionInit(context: HookContext) {
  useEffect(() => {
    console.log('${extensionName} Extension initialized in component')
    
    return () => {
      console.log('${extensionName} Extension cleanup')
    }
  }, [context])
}

export const hooks = {
  useExtensionInit,
}
`
}

/**
 * 生成README.md
 */
async function generateReadme(extensionName: string, templateConfig: ExtensionTemplate): Promise<string> {
  return `# ${extensionName}

${templateConfig.description}

## 功能特性

${templateConfig.capabilities.map(cap => `- ✅ ${cap.charAt(0).toUpperCase() + cap.slice(1)}`).join('\\n')}

## 安装

\`\`\`bash
linch-kit extension install ${extensionName}
\`\`\`

## 开发

\`\`\`bash
# 开发模式
bun dev

# 构建
bun build

# 测试
bun test

# 代码检查
bun lint
\`\`\`

## 配置

Extension配置位于 \`package.json\` 的 \`linchkit\` 字段中。

## 许可证

MIT
`
}

/**
 * Extension命令定义
 */
export const extensionCommand = new Command('extension')
  .description('LinchKit Extension开发工具')
  .alias('ext')

// 创建Extension命令
extensionCommand
  .command('create')
  .description('创建新的Extension')
  .argument('<name>', 'Extension名称')
  .option('-t, --template <template>', 'Extension模板', 'basic')
  .option('-o, --output <path>', '输出目录')
  .option('--no-install', '跳过依赖安装')
  .action(createExtension)

// 安装Extension命令
extensionCommand
  .command('install')
  .description('安装Extension')
  .argument('<name>', 'Extension名称')
  .option('-s, --source <source>', '安装源')
  .option('-v, --version <version>', '版本')
  .option('-r, --registry <registry>', '注册源')
  .action(installExtension)

// 列出Extension命令
extensionCommand
  .command('list')
  .description('列出已安装的Extension')
  .alias('ls')
  .action(listExtensions)

// 开发模式命令
extensionCommand
  .command('dev')
  .description('启动Extension开发模式')
  .argument('[name]', 'Extension名称')
  .action(devExtension)