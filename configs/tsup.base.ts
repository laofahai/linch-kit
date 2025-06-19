import { defineConfig, type Options } from 'tsup'
import { builtinModules } from 'module'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface TsupBaseOptions {
  /** 入口文件配置 */
  entry?: Options['entry']
  /** 是否为 CLI 包 */
  isCli?: boolean
  /** 是否为 React 组件库 */
  isReact?: boolean
  /** 额外的外部依赖 */
  external?: string[]
  /** 是否启用代码分割 */
  splitting?: boolean
  /** 是否启用 treeshaking */
  treeshake?: boolean
  /** 自定义配置覆盖 */
  override?: Partial<Options>
}

/**
 * 获取包信息
 */
function getPackageInfo() {
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
    return {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}),
      peerDependencies: Object.keys(packageJson.peerDependencies || {})
    }
  } catch {
    return { name: '', version: '', dependencies: [], peerDependencies: [] }
  }
}

/**
 * 创建基础的 tsup 配置
 */
export function createTsupConfig(options: TsupBaseOptions = {}): Options {
  const {
    entry = ['src/index.ts'],
    isCli = false,
    isReact = false,
    external = [],
    splitting = false,
    treeshake = true,
    override = {}
  } = options

  const packageInfo = getPackageInfo()

  // 基础外部依赖
  const baseExternal = [
    ...builtinModules,
    ...packageInfo.peerDependencies,
    // 常见的外部依赖
    'next',
    'next-auth',
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@types/react',
    '@types/react-dom',
    // Linch Kit 内部包
    '@linch-kit/core',
    '@linch-kit/types',
    '@linch-kit/ui',
    '@linch-kit/auth-core',
    '@linch-kit/schema',
    '@linch-kit/trpc',
    ...external
  ]

  const baseConfig: Options = {
    entry,
    format: ['cjs', 'esm'],
    dts: {
      resolve: true,
      // 为 React 组件库生成更好的类型
      compilerOptions: isReact ? {
        jsx: 'react-jsx'
      } : undefined
    },
    clean: true,
    sourcemap: true,
    target: 'es2022',
    external: baseExternal,
    splitting,
    treeshake,
    tsconfig: './tsconfig.build.json',
    // 优化输出
    minify: process.env.NODE_ENV === 'production',
    // 添加 banner
    banner: {
      js: `/**
 * ${packageInfo.name} v${packageInfo.version}
 * (c) ${new Date().getFullYear()} Linch Kit
 * @license MIT
 */`
    },
    // esbuild 选项
    esbuildOptions: (options) => {
      options.conditions = ['module']
      if (isReact) {
        options.jsx = 'automatic'
        options.jsxImportSource = 'react'
      }
    }
  }

  // CLI 特殊配置
  if (isCli) {
    baseConfig.shims = true
    baseConfig.platform = 'node'
    baseConfig.onSuccess = async () => {
      const { chmodSync } = await import('fs')
      try {
        // 为 CLI 文件添加执行权限
        if (Array.isArray(entry)) {
          entry.forEach(e => {
            if (typeof e === 'string' && e.includes('cli')) {
              chmodSync(`dist/${e.replace('src/', '').replace('.ts', '.js')}`, '755')
            }
          })
        }
      } catch (error) {
        console.warn('Failed to set executable permissions:', error)
      }
    }
  }

  // React 组件库特殊配置
  if (isReact) {
    baseConfig.format = ['esm', 'cjs']
    baseConfig.external = [
      ...baseExternal,
      'react',
      'react-dom',
      'react/jsx-runtime'
    ]
  }

  return {
    ...baseConfig,
    ...override
  }
}

/**
 * 标准库包配置
 */
export function createLibraryConfig(options: Omit<TsupBaseOptions, 'isCli'> = {}) {
  return defineConfig(createTsupConfig(options))
}

/**
 * CLI 包配置
 */
export function createCliConfig(options: Omit<TsupBaseOptions, 'isCli'> = {}) {
  return defineConfig(createTsupConfig({ ...options, isCli: true }))
}

/**
 * React 组件库配置
 */
export function createReactConfig(options: Omit<TsupBaseOptions, 'isReact'> = {}) {
  return defineConfig(createTsupConfig({ ...options, isReact: true }))
}

/**
 * 多入口配置
 */
export function createMultiEntryConfig(entries: Record<string, string>, options: TsupBaseOptions = {}) {
  return defineConfig(createTsupConfig({
    ...options,
    entry: entries,
    splitting: true
  }))
}
