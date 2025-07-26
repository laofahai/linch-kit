/**
 * 创建租户页面
 *
 * 表单页面用于创建新的租户
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Label,
} from '@linch-kit/ui/server'
import {
  Button,
  Input,
  Textarea,
} from '@linch-kit/ui/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@linch-kit/ui/client'
import { Building2, ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'

import { useTenantOperations } from '../../hooks/useTenants'
import { useConsoleTranslation } from '../../i18n'

// 表单验证Schema
const createTenantSchema = z.object({
  name: z.string().min(1, '租户名称不能为空').max(100, '租户名称不能超过100个字符'),
  slug: z
    .string()
    .min(1, 'URL标识不能为空')
    .max(50, 'URL标识不能超过50个字符')
    .regex(/^[a-z0-9-]+$/, 'URL标识只能包含小写字母、数字和连字符'),
  domain: z.string().optional(),
  description: z.string().optional(),
  businessLicense: z.string().max(50, '营业执照号码不能超过50个字符').optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  maxUsers: z.number().min(1, '最大用户数必须大于0').max(10000, '最大用户数不能超过10000'),
  maxStorage: z
    .number()
    .min(100, '最大存储空间必须大于100MB')
    .max(1000000, '最大存储空间不能超过1TB'),
  maxApiCalls: z
    .number()
    .min(1000, 'API调用次数必须大于1000')
    .max(10000000, 'API调用次数不能超过1000万'),
  maxPlugins: z.number().min(1, '最大插件数必须大于0').max(100, '最大插件数不能超过100'),
  settings: z.record(z.any()).optional(),
  autoActivate: z.boolean().default(true),
})

type CreateTenantForm = z.infer<typeof createTenantSchema>

/**
 * 创建租户页面
 */
export function TenantCreate() {
  const router = useRouter()
  const _t = useConsoleTranslation()
  const { createTenant } = useTenantOperations()

  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      plan: 'starter',
      billingCycle: 'monthly',
      maxUsers: 10,
      maxStorage: 1000,
      maxApiCalls: 10000,
      maxPlugins: 5,
      autoActivate: true,
    },
  })

  const planValue = watch('plan')
  const nameValue = watch('name')

  // 根据计划自动设置配额
  React.useEffect(() => {
    const quotasByPlan = {
      free: {
        maxUsers: 5,
        maxStorage: 500,
        maxApiCalls: 5000,
        maxPlugins: 2,
      },
      starter: {
        maxUsers: 10,
        maxStorage: 1000,
        maxApiCalls: 10000,
        maxPlugins: 5,
      },
      professional: {
        maxUsers: 50,
        maxStorage: 10000,
        maxApiCalls: 100000,
        maxPlugins: 20,
      },
      enterprise: {
        maxUsers: 1000,
        maxStorage: 100000,
        maxApiCalls: 1000000,
        maxPlugins: 100,
      },
    }

    const quotas = quotasByPlan[planValue as keyof typeof quotasByPlan]
    if (quotas) {
      setValue('maxUsers', quotas.maxUsers)
      setValue('maxStorage', quotas.maxStorage)
      setValue('maxApiCalls', quotas.maxApiCalls)
      setValue('maxPlugins', quotas.maxPlugins)
    }
  }, [planValue, setValue])

  // 根据名称自动生成slug
  React.useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setValue('slug', slug)
    }
  }, [nameValue, setValue])

  // 提交表单
  const onSubmit = async (data: CreateTenantForm) => {
    setSubmitError(null)

    try {
      const tenant = await createTenant.mutateAsync({
        ...data,
        status: data.autoActivate ? 'active' : 'pending',
      })

      // 跳转到租户详情页
      router.push(`/admin/tenants/${(tenant as any)?.id || 'new'`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建租户失败'
      setSubmitError(errorMessage)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/tenants">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回租户列表
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">创建租户</h1>
          <p className="text-muted-foreground">创建一个新的租户账户</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              基本信息
            </CardTitle>
            <CardDescription>设置租户的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">租户名称 *</Label>
                <Input
                  id="name"
                  placeholder="输入租户名称"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL标识 *</Label>
                <Input
                  id="slug"
                  placeholder="url-identifier"
                  {...register('slug')}
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  将用于租户的URL：https://app.example.com/{watch('slug')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">自定义域名</Label>
              <Input
                id="domain"
                placeholder="custom.example.com"
                {...register('domain')}
                className={errors.domain ? 'border-red-500' : ''}
              />
              {errors.domain && (
                <p className="text-sm text-red-500">{errors.domain.message}</p>
              )}
              <p className="text-xs text-muted-foreground">可选，设置租户的自定义域名</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessLicense">营业执照号码</Label>
              <Input
                id="businessLicense"
                placeholder="输入营业执照号码"
                {...register('businessLicense')}
                className={errors.businessLicense ? 'border-red-500' : ''}
              />
              {errors.businessLicense && (
                <p className="text-sm text-red-500">{errors.businessLicense.message}</p>
              )}
              <p className="text-xs text-muted-foreground">可选，企业租户的营业执照注册号码</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="租户描述..."
                rows={3}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 订阅计划 */}
        <Card>
          <CardHeader>
            <CardTitle>订阅计划</CardTitle>
            <CardDescription>选择租户的订阅计划和计费周期</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">订阅计划 *</Label>
                <Select
                  value={watch('plan')}
                  onValueChange={value =>
                    setValue('plan', value as 'free' | 'starter' | 'professional' | 'enterprise')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择订阅计划" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">免费版</SelectItem>
                    <SelectItem value="starter">入门版</SelectItem>
                    <SelectItem value="professional">专业版</SelectItem>
                    <SelectItem value="enterprise">企业版</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCycle">计费周期</Label>
                <Select
                  value={watch('billingCycle') || 'monthly'}
                  onValueChange={value => setValue('billingCycle', value as 'monthly' | 'yearly')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择计费周期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">按月</SelectItem>
                    <SelectItem value="yearly">按年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 配额设置 */}
        <Card>
          <CardHeader>
            <CardTitle>配额设置</CardTitle>
            <CardDescription>根据订阅计划自动设置，也可以手动调整</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">最大用户数 *</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="10000"
                  {...register('maxUsers', { valueAsNumber: true })}
                  className={errors.maxUsers ? 'border-red-500' : ''}
                />
                {errors.maxUsers && (
                  <p className="text-sm text-red-500">{errors.maxUsers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStorage">最大存储空间 (MB) *</Label>
                <Input
                  id="maxStorage"
                  type="number"
                  min="100"
                  max="1000000"
                  {...register('maxStorage', { valueAsNumber: true })}
                  className={errors.maxStorage ? 'border-red-500' : ''}
                />
                {errors.maxStorage && (
                  <p className="text-sm text-red-500">{errors.maxStorage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxApiCalls">API调用限制 (次/月) *</Label>
                <Input
                  id="maxApiCalls"
                  type="number"
                  min="1000"
                  max="10000000"
                  {...register('maxApiCalls', { valueAsNumber: true })}
                  className={errors.maxApiCalls ? 'border-red-500' : ''}
                />
                {errors.maxApiCalls && (
                  <p className="text-sm text-red-500">{errors.maxApiCalls.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPlugins">最大插件数 *</Label>
                <Input
                  id="maxPlugins"
                  type="number"
                  min="1"
                  max="100"
                  {...register('maxPlugins', { valueAsNumber: true })}
                  className={errors.maxPlugins ? 'border-red-500' : ''}
                />
                {errors.maxPlugins && (
                  <p className="text-sm text-red-500">{errors.maxPlugins.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 激活设置 */}
        <Card>
          <CardHeader>
            <CardTitle>激活设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoActivate"
                checked={watch('autoActivate')}
                onCheckedChange={checked => setValue('autoActivate', checked)}
              />
              <Label htmlFor="autoActivate">创建后自动激活</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              关闭后租户将处于待激活状态，需要手动激活
            </p>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* 提交按钮 */}
        <div className="flex items-center justify-end space-x-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/admin/tenants">
              <X className="h-4 w-4 mr-2" />
              取消
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? '创建中...' : '创建租户'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default TenantCreate
