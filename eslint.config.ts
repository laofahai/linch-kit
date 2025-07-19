// eslint.config.ts
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'

export default [
  // 忽略文件配置
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.config.ts',
      '**/*.config.js',
      '**/coverage/**',
      '**/.next/**',
      '**/build/**',
      'e2e/**/*.e2e.ts',
      'playwright-report/**',
      'test-results/**',
      'scripts/**/*.ts',
      // Security Sentinel临时文件
      '.claude/security-sentinel/**/*',
      // 配置文件目录
      'configs/**/*',
      // 测试工具目录
      'tools/testing/**/*',
      // 开发工具脚本
      'tools/dev/**/*',
      'tools/docs/**/*',
      // E2E测试文件
      '**/*.e2e.ts',
      // 类型定义文件（在无项目的目录中）
      '**/*.d.ts',
      // 独立脚本文件
      'tools/ai-platform/scripts/**/*',
      'tools/ai-platform/cli.ts',
      'tools/ai-platform/fix-console-logs.ts',
      // vitest配置文件
      '**/vitest.setup.ts',
      // 测试文件不在tsconfig项目中
      '**/*.test.ts',
      '**/*.spec.ts',
      // CLI文件
      '**/bin/**/*',
    ],
  },

  // ESLint 推荐规则
  js.configs.recommended,

  // TypeScript 解析器和规则
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: [
          './tsconfig.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json',
          './modules/*/tsconfig.json',
          './extensions/*/tsconfig.json',
          './tools/*/tsconfig.json',
        ],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: importPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
        },
        typescript: {
          project: [
            './tsconfig.json',
            './apps/*/tsconfig.json',
            './packages/*/tsconfig.json',
            './modules/*/tsconfig.json',
            './extensions/*/tsconfig.json',
            './tools/*/tsconfig.json',
          ],
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'off',
      'no-undef': 'off', // TypeScript 处理未定义变量检查
    },
  },

  // 测试文件特殊规则
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // 装饰器文件特殊规则 - 装饰器代码需要类型灵活性
  {
    files: ['**/decorators/**/*.ts', '**/decorators/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Auth 包特殊规则 - 权限引擎和适配器需要类型灵活性
  {
    files: ['packages/auth/**/*.ts', 'packages/auth/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // tRPC 包特殊规则 - API路由器需要动态类型和未使用的占位符
  {
    files: ['packages/trpc/**/*.ts', 'packages/trpc/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // 降级为警告
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|permissions|logic',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Starter App 特殊规则 - 演示代码需要一些灵活性
  {
    files: ['apps/starter-app/**/*.ts', 'apps/starter-app/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // 演示代码降低为警告
    },
  },

  // AI Platform 特殊规则 - AI工具需要类型灵活性
  {
    files: ['tools/ai-platform/**/*.ts', 'tools/ai-platform/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // AI工具降级为警告
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_.*|options|analysis|functions|classes|error',
          varsIgnorePattern: '^_.*|log|logger|error|createLogger|options|analysis|functions|classes|promptWords|ExtensionMetadata|EntityMetadata',
          ignoreRestSiblings: true,
        },
      ],
      'no-redeclare': 'off', // AI工具中可能有重复声明
      'import/order': 'warn', // 降级为警告
      'no-case-declarations': 'off', // 允许case块中的声明
      'no-useless-escape': 'off', // 允许冗余转义（正则表达式中可能需要）
    },
  },

  // prettier 关闭和兼容相关规则
  {
    rules: {
      ...prettierConfig.rules,
    },
  },
]
