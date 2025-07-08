/**
 * @linch-kit/schema 国际化系统集成
 *
 * 使用@linch-kit/core的国际化功能
 *
 * @module infrastructure/i18n
 */

import { createPackageI18n, type TranslationFunction } from '@linch-kit/core'

/**
 * Schema包国际化配置
 * 使用Core包的国际化功能
 */
export const packageI18n = createPackageI18n({
  packageName: 'schema',
  defaultLocale: 'en',
  defaultMessages: {
    en: {
      // 代码生成相关消息
      'generate.starting': 'Starting code generation...',
      'generate.success': 'Code generation completed successfully',
      'generate.error': 'Code generation failed: {error}',
      'generate.file.created': 'Generated file: {file}',
      'generate.file.updated': 'Updated file: {file}',

      // Schema验证相关消息
      'validate.starting': 'Starting schema validation...',
      'validate.success': 'Schema validation completed successfully',
      'validate.error': 'Schema validation failed: {error}',
      'validate.entity.invalid': 'Invalid entity definition: {entity}',
      'validate.field.invalid': 'Invalid field definition: {field}',

      // CLI命令相关消息
      'cli.init.starting': 'Initializing schema structure...',
      'cli.init.success': 'Schema structure initialized successfully',
      'cli.init.dirCreated': 'Created directory: {dir}',
      'cli.init.configCreated': 'Created configuration file',
      'cli.init.examplesCreated': 'Created example schema files',

      // 插件相关消息
      'plugin.register.success': 'Schema plugin registered successfully',
      'plugin.register.error': 'Failed to register schema plugin: {error}',
      'plugin.init.starting': 'Initializing schema plugin...',
      'plugin.init.success': 'Schema plugin initialized successfully',

      // 错误消息
      'error.fileNotFound': 'File not found: {file}',
      'error.invalidConfig': 'Invalid configuration: {config}',
      'error.generatorNotFound': 'Generator not found: {generator}',
      'error.entityNotFound': 'Entity not found: {entity}',
    },
    'zh-CN': {
      // 代码生成相关消息
      'generate.starting': '开始代码生成...',
      'generate.success': '代码生成成功完成',
      'generate.error': '代码生成失败: {error}',
      'generate.file.created': '已生成文件: {file}',
      'generate.file.updated': '已更新文件: {file}',

      // Schema验证相关消息
      'validate.starting': '开始Schema验证...',
      'validate.success': 'Schema验证成功完成',
      'validate.error': 'Schema验证失败: {error}',
      'validate.entity.invalid': '无效的实体定义: {entity}',
      'validate.field.invalid': '无效的字段定义: {field}',

      // CLI命令相关消息
      'cli.init.starting': '正在初始化Schema结构...',
      'cli.init.success': 'Schema结构初始化成功',
      'cli.init.dirCreated': '已创建目录: {dir}',
      'cli.init.configCreated': '已创建配置文件',
      'cli.init.examplesCreated': '已创建示例Schema文件',

      // 插件相关消息
      'plugin.register.success': 'Schema插件注册成功',
      'plugin.register.error': 'Schema插件注册失败: {error}',
      'plugin.init.starting': '正在初始化Schema插件...',
      'plugin.init.success': 'Schema插件初始化成功',

      // 错误消息
      'error.fileNotFound': '文件未找到: {file}',
      'error.invalidConfig': '无效配置: {config}',
      'error.generatorNotFound': '生成器未找到: {generator}',
      'error.entityNotFound': '实体未找到: {entity}',
    },
  },
})

/**
 * 获取Schema包的翻译函数
 * 支持用户自定义翻译函数覆盖
 *
 * @param userT 用户提供的翻译函数（可选）
 * @returns 翻译函数
 */
export const useSchemaTranslation = (userT?: TranslationFunction): TranslationFunction => {
  return packageI18n.getTranslation(userT)
}
