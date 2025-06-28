/**
 * 插件管理服务
 * 
 * 基于 @linch-kit/crud 和 @linch-kit/core 的插件管理业务逻辑
 * 集成插件系统、版本管理和租户插件安装
 */

import { 
  createCrudService, 
  type CrudOptions,
  type CrudContext,
  type CrudResult 
} from '@linch-kit/crud'
import { 
  PluginSystem,
  logger,
  type PluginManifest
} from '@linch-kit/core'
import { requireAuth, requirePermission } from '@linch-kit/auth'
import { z } from 'zod'
import { 
  PluginEntity, 
  PluginVersionEntity, 
  TenantPluginEntity 
} from '../entities/plugin'
import { tenantService } from './tenant.service'

/**
 * 插件创建输入验证
 */
export const CreatePluginInput = z.object({
  name: z.string().min(1).max(100),
  version: z.string().max(20),
  description: z.string().optional(),
  author: z.string().max(100),
  category: z.enum([
    'UI', 'DATA', 'INTEGRATION', 'SECURITY', 
    'MONITORING', 'AUTOMATION', 'WORKFLOW', 'OTHER'
  ]),
  tags: z.array(z.string()).default([]),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  documentation: z.string().url().optional(),
  license: z.string().max(50).optional(),
  downloadUrl: z.string().url().optional(),
  installCommand: z.string().optional(),
  configSchema: z.record(z.any()).optional(),
  defaultConfig: z.record(z.any()).optional(),
  minLinchKitVersion: z.string().max(20).optional(),
  maxLinchKitVersion: z.string().max(20).optional(),
  dependencies: z.array(z.string()).default([]),
  isOfficial: z.boolean().default(false)
})

/**
 * 插件更新输入验证
 */
export const UpdatePluginInput = CreatePluginInput.partial()

/**
 * 插件安装输入验证
 */
export const InstallPluginInput = z.object({
  tenantId: z.string(),
  pluginId: z.string(),
  version: z.string().optional(),
  config: z.record(z.any()).optional(),
  autoUpdate: z.boolean().default(false),
  updateChannel: z.enum(['stable', 'beta', 'alpha']).default('stable')
})

/**
 * 插件查询过滤器
 */
export const PluginFilters = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'DEPRECATED', 'REMOVED']).optional(),
  category: z.enum([
    'UI', 'DATA', 'INTEGRATION', 'SECURITY', 
    'MONITORING', 'AUTOMATION', 'WORKFLOW', 'OTHER'
  ]).optional(),
  isOfficial: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  minRating: z.number().min(1).max(5).optional()
})

export type CreatePluginInput = z.infer<typeof CreatePluginInput>
export type UpdatePluginInput = z.infer<typeof UpdatePluginInput>
export type InstallPluginInput = z.infer<typeof InstallPluginInput>
export type PluginFilters = z.infer<typeof PluginFilters>

/**
 * 插件管理服务类
 */
export class PluginService {
  private pluginCrudService = createCrudService(PluginEntity, {
    permissions: {
      create: ['plugin:create'],
      read: ['plugin:read'],
      update: ['plugin:update'],
      delete: ['plugin:delete']
    },
    hooks: {
      beforeCreate: this.beforeCreatePlugin.bind(this),
      afterCreate: this.afterCreatePlugin.bind(this),
      beforeUpdate: this.beforeUpdatePlugin.bind(this)
    }
  })

  private versionCrudService = createCrudService(PluginVersionEntity, {
    permissions: {
      create: ['plugin:version:create'],
      read: ['plugin:version:read'],
      update: ['plugin:version:update'],
      delete: ['plugin:version:delete']
    }
  })

  private tenantPluginCrudService = createCrudService(TenantPluginEntity, {
    permissions: {
      create: ['plugin:install'],
      read: ['plugin:tenant:read'],
      update: ['plugin:configure'],
      delete: ['plugin:uninstall']
    }
  })

  /**
   * 创建插件
   */
  @requireAuth()
  @requirePermission('plugin:create')
  async createPlugin(
    input: CreatePluginInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('创建插件', { 
      pluginName: input.name, 
      version: input.version,
      operatorId: context.user?.id 
    })

    try {
      const validatedInput = CreatePluginInput.parse(input)
      
      const pluginId = crypto.randomUUID()
      
      const pluginData = {
        id: pluginId,
        ...validatedInput,
        authorId: context.user?.id,
        status: 'DRAFT' as const,
        downloads: 0,
        weeklyDownloads: 0,
        ratingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 创建插件记录
      const result = await this.pluginCrudService.create(pluginData, context)
      
      if (result.success) {
        // 创建初始版本记录
        await this.createPluginVersion({
          pluginId,
          version: validatedInput.version,
          isStable: true,
          isLatest: true,
          downloadUrl: validatedInput.downloadUrl,
          minLinchKitVersion: validatedInput.minLinchKitVersion
        }, context)

        logger.info('插件创建成功', { pluginId, pluginName: input.name })
      }
      
      return result
    } catch (error) {
      logger.error('插件创建失败', { error, input })
      throw error
    }
  }

  /**
   * 创建插件版本
   */
  @requireAuth()
  @requirePermission('plugin:version:create')
  async createPluginVersion(
    input: {
      pluginId: string
      version: string
      changelog?: string
      breakingChanges?: string
      downloadUrl?: string
      minLinchKitVersion?: string
      isStable?: boolean
      isLatest?: boolean
    },
    context: CrudContext
  ): Promise<CrudResult<any>> {
    const versionId = crypto.randomUUID()
    
    const versionData = {
      id: versionId,
      ...input,
      downloads: 0,
      createdAt: new Date()
    }

    // 如果是最新版本，将其他版本的 isLatest 设为 false
    if (input.isLatest) {
      await this.versionCrudService.updateMany({
        where: { pluginId: input.pluginId },
        data: { isLatest: false }
      }, context)
    }

    return await this.versionCrudService.create(versionData, context)
  }

  /**
   * 发布插件
   */
  @requireAuth()
  @requirePermission('plugin:publish')
  async publishPlugin(
    pluginId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('发布插件', { pluginId, operatorId: context.user?.id })

    const result = await this.pluginCrudService.update(
      pluginId,
      {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      context
    )

    if (result.success) {
      // TODO: 触发插件发布事件
      logger.info('插件发布成功', { pluginId })
    }

    return result
  }

  /**
   * 安装插件到租户
   */
  @requireAuth()
  @requirePermission('plugin:install')
  async installPlugin(
    input: InstallPluginInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('安装插件', { 
      tenantId: input.tenantId,
      pluginId: input.pluginId,
      operatorId: context.user?.id 
    })

    try {
      const validatedInput = InstallPluginInput.parse(input)
      
      // 检查插件是否存在且已发布
      const pluginResult = await this.pluginCrudService.findById(
        validatedInput.pluginId,
        context
      )
      
      if (!pluginResult.success || !pluginResult.data) {
        return {
          success: false,
          error: new Error('插件不存在')
        }
      }

      const plugin = pluginResult.data
      if (plugin.status !== 'PUBLISHED') {
        return {
          success: false,
          error: new Error('插件未发布，无法安装')
        }
      }

      // 检查租户插件配额
      const quotaCheck = await tenantService.checkQuotaLimits(
        validatedInput.tenantId,
        'plugins',
        1,
        context
      )
      
      if (!quotaCheck.allowed) {
        return {
          success: false,
          error: new Error(`租户插件配额已满 (${quotaCheck.current}/${quotaCheck.limit})`)
        }
      }

      // 检查是否已安装
      const existingInstall = await this.tenantPluginCrudService.findFirst({
        where: {
          tenantId: validatedInput.tenantId,
          pluginId: validatedInput.pluginId
        }
      }, context)

      if (existingInstall.success && existingInstall.data) {
        return {
          success: false,
          error: new Error('插件已安装')
        }
      }

      // 确定安装版本
      const targetVersion = validatedInput.version || await this.getLatestVersion(
        validatedInput.pluginId,
        context
      )

      if (!targetVersion) {
        return {
          success: false,
          error: new Error('无法确定安装版本')
        }
      }

      // 创建安装记录
      const installId = crypto.randomUUID()
      const installData = {
        id: installId,
        tenantId: validatedInput.tenantId,
        pluginId: validatedInput.pluginId,
        version: targetVersion,
        status: 'INSTALLED' as const,
        config: validatedInput.config || plugin.defaultConfig || {},
        autoUpdate: validatedInput.autoUpdate,
        updateChannel: validatedInput.updateChannel,
        errorCount: 0,
        installedAt: new Date(),
        updatedAt: new Date()
      }

      const result = await this.tenantPluginCrudService.create(installData, context)

      if (result.success) {
        // 尝试激活插件
        try {
          await this.activatePlugin(
            validatedInput.tenantId,
            validatedInput.pluginId,
            context
          )
        } catch (error) {
          logger.warn('插件安装成功但激活失败', { 
            tenantId: validatedInput.tenantId,
            pluginId: validatedInput.pluginId,
            error 
          })
        }

        // 更新下载统计
        await this.incrementDownloadCount(validatedInput.pluginId, targetVersion)

        logger.info('插件安装成功', { 
          tenantId: validatedInput.tenantId,
          pluginId: validatedInput.pluginId,
          version: targetVersion
        })
      }

      return result
    } catch (error) {
      logger.error('插件安装失败', { error, input })
      throw error
    }
  }

  /**
   * 激活插件
   */
  @requireAuth()
  @requirePermission('plugin:configure')
  async activatePlugin(
    tenantId: string,
    pluginId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('激活插件', { tenantId, pluginId, operatorId: context.user?.id })

    try {
      // 获取插件安装信息
      const installResult = await this.tenantPluginCrudService.findFirst({
        where: { tenantId, pluginId }
      }, context)

      if (!installResult.success || !installResult.data) {
        return {
          success: false,
          error: new Error('插件未安装')
        }
      }

      const install = installResult.data

      // 使用 PluginSystem 激活插件
      await PluginSystem.activate(pluginId, {
        tenantId,
        config: install.config || {},
        version: install.version
      })

      // 更新状态为激活
      const result = await this.tenantPluginCrudService.update(
        install.id,
        {
          status: 'ACTIVE',
          lastUsedAt: new Date(),
          updatedAt: new Date(),
          lastError: null,
          errorCount: 0
        },
        context
      )

      if (result.success) {
        logger.info('插件激活成功', { tenantId, pluginId })
      }

      return result
    } catch (error) {
      logger.error('插件激活失败', { error, tenantId, pluginId })
      
      // 更新错误状态
      await this.updatePluginError(tenantId, pluginId, error.message, context)
      
      throw error
    }
  }

  /**
   * 停用插件
   */
  @requireAuth()
  @requirePermission('plugin:configure')
  async deactivatePlugin(
    tenantId: string,
    pluginId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('停用插件', { tenantId, pluginId, operatorId: context.user?.id })

    try {
      // 使用 PluginSystem 停用插件
      await PluginSystem.deactivate(pluginId, tenantId)

      // 更新状态
      const installResult = await this.tenantPluginCrudService.findFirst({
        where: { tenantId, pluginId }
      }, context)

      if (installResult.success && installResult.data) {
        const result = await this.tenantPluginCrudService.update(
          installResult.data.id,
          {
            status: 'INACTIVE',
            updatedAt: new Date()
          },
          context
        )

        if (result.success) {
          logger.info('插件停用成功', { tenantId, pluginId })
        }

        return result
      }

      return { success: false, error: new Error('插件安装记录不存在') }
    } catch (error) {
      logger.error('插件停用失败', { error, tenantId, pluginId })
      throw error
    }
  }

  /**
   * 卸载插件
   */
  @requireAuth()
  @requirePermission('plugin:uninstall')
  async uninstallPlugin(
    tenantId: string,
    pluginId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('卸载插件', { tenantId, pluginId, operatorId: context.user?.id })

    try {
      // 先停用插件
      await this.deactivatePlugin(tenantId, pluginId, context)

      // 删除安装记录
      const installResult = await this.tenantPluginCrudService.findFirst({
        where: { tenantId, pluginId }
      }, context)

      if (installResult.success && installResult.data) {
        const result = await this.tenantPluginCrudService.delete(
          installResult.data.id,
          context
        )

        if (result.success) {
          logger.info('插件卸载成功', { tenantId, pluginId })
        }

        return result
      }

      return { success: false, error: new Error('插件安装记录不存在') }
    } catch (error) {
      logger.error('插件卸载失败', { error, tenantId, pluginId })
      throw error
    }
  }

  /**
   * 获取插件市场列表
   */
  @requireAuth()
  @requirePermission('plugin:read')
  async listMarketplacePlugins(
    filters: PluginFilters = {},
    context: CrudContext
  ): Promise<CrudResult<any[]>> {
    const validatedFilters = PluginFilters.parse(filters)
    
    const where: any = {
      status: 'PUBLISHED' // 只显示已发布的插件
    }
    
    if (validatedFilters.category) {
      where.category = validatedFilters.category
    }
    
    if (typeof validatedFilters.isOfficial === 'boolean') {
      where.isOfficial = validatedFilters.isOfficial
    }
    
    if (typeof validatedFilters.isFeatured === 'boolean') {
      where.isFeatured = validatedFilters.isFeatured
    }
    
    if (validatedFilters.search) {
      where.OR = [
        { name: { contains: validatedFilters.search, mode: 'insensitive' } },
        { description: { contains: validatedFilters.search, mode: 'insensitive' } },
        { author: { contains: validatedFilters.search, mode: 'insensitive' } }
      ]
    }
    
    if (validatedFilters.tags && validatedFilters.tags.length > 0) {
      where.tags = {
        hasSome: validatedFilters.tags
      }
    }
    
    if (validatedFilters.minRating) {
      where.rating = {
        gte: validatedFilters.minRating
      }
    }

    return await this.pluginCrudService.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { downloads: 'desc' },
        { updatedAt: 'desc' }
      ]
    }, context)
  }

  /**
   * 获取租户已安装插件
   */
  @requireAuth()
  @requirePermission('plugin:tenant:read')
  async listTenantPlugins(
    tenantId: string,
    context: CrudContext
  ): Promise<CrudResult<any[]>> {
    return await this.tenantPluginCrudService.findMany({
      where: { tenantId },
      orderBy: { installedAt: 'desc' }
    }, context)
  }

  /**
   * 更新插件配置
   */
  @requireAuth()
  @requirePermission('plugin:configure')
  async updatePluginConfig(
    tenantId: string,
    pluginId: string,
    config: Record<string, any>,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('更新插件配置', { tenantId, pluginId, operatorId: context.user?.id })

    try {
      const installResult = await this.tenantPluginCrudService.findFirst({
        where: { tenantId, pluginId }
      }, context)

      if (!installResult.success || !installResult.data) {
        return {
          success: false,
          error: new Error('插件未安装')
        }
      }

      // 更新配置
      const result = await this.tenantPluginCrudService.update(
        installResult.data.id,
        {
          config,
          updatedAt: new Date()
        },
        context
      )

      if (result.success) {
        // 重新激活插件以应用新配置
        if (installResult.data.status === 'ACTIVE') {
          await this.deactivatePlugin(tenantId, pluginId, context)
          await this.activatePlugin(tenantId, pluginId, context)
        }

        logger.info('插件配置更新成功', { tenantId, pluginId })
      }

      return result
    } catch (error) {
      logger.error('插件配置更新失败', { error, tenantId, pluginId })
      throw error
    }
  }

  /**
   * 获取插件最新版本
   */
  private async getLatestVersion(
    pluginId: string,
    context: CrudContext
  ): Promise<string | null> {
    const versionResult = await this.versionCrudService.findFirst({
      where: { 
        pluginId,
        isLatest: true
      }
    }, context)

    return versionResult.success && versionResult.data 
      ? versionResult.data.version 
      : null
  }

  /**
   * 增加下载统计
   */
  private async incrementDownloadCount(
    pluginId: string,
    version: string
  ): Promise<void> {
    try {
      // 更新插件总下载数
      await this.pluginCrudService.updateRaw({
        where: { id: pluginId },
        data: {
          downloads: { increment: 1 },
          weeklyDownloads: { increment: 1 }
        }
      })

      // 更新版本下载数
      await this.versionCrudService.updateRaw({
        where: { 
          pluginId,
          version
        },
        data: {
          downloads: { increment: 1 }
        }
      })
    } catch (error) {
      logger.warn('更新下载统计失败', { error, pluginId, version })
    }
  }

  /**
   * 更新插件错误状态
   */
  private async updatePluginError(
    tenantId: string,
    pluginId: string,
    errorMessage: string,
    context: CrudContext
  ): Promise<void> {
    try {
      const installResult = await this.tenantPluginCrudService.findFirst({
        where: { tenantId, pluginId }
      }, context)

      if (installResult.success && installResult.data) {
        await this.tenantPluginCrudService.update(
          installResult.data.id,
          {
            status: 'ERROR',
            lastError: errorMessage,
            errorCount: installResult.data.errorCount + 1,
            updatedAt: new Date()
          },
          context
        )
      }
    } catch (error) {
      logger.warn('更新插件错误状态失败', { error, tenantId, pluginId })
    }
  }

  /**
   * 插件创建前钩子
   */
  private async beforeCreatePlugin(data: any, context: CrudContext): Promise<any> {
    // 检查插件名称是否已存在
    const existing = await this.pluginCrudService.findFirst(
      { where: { name: data.name } },
      context
    )
    
    if (existing.success && existing.data) {
      throw new Error(`插件名称 '${data.name}' 已存在`)
    }

    return data
  }

  /**
   * 插件创建后钩子
   */
  private async afterCreatePlugin(data: any, context: CrudContext): Promise<void> {
    logger.info('插件创建后处理完成', { pluginId: data.id, pluginName: data.name })
  }

  /**
   * 插件更新前钩子
   */
  private async beforeUpdatePlugin(id: string, data: any, context: CrudContext): Promise<any> {
    // 如果更新名称，检查是否冲突
    if (data.name) {
      const existing = await this.pluginCrudService.findFirst(
        { 
          where: { 
            name: data.name,
            id: { not: id }
          } 
        },
        context
      )
      
      if (existing.success && existing.data) {
        throw new Error(`插件名称 '${data.name}' 已存在`)
      }
    }

    return data
  }
}

/**
 * 导出插件服务实例
 */
export const pluginService = new PluginService()