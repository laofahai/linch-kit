/**
 * 用户管理 Hooks
 *
 * 提供用户数据管理和操作功能 (临时使用stub实现)
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

// Mock toast function
const toast = {
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.error('❌ Error:', message),
  info: (message: string) => console.info('ℹ️ Info:', message),
  warning: (message: string) => console.warn('⚠️ Warning:', message),
}

// Mock data generators
function generateMockUsers() {
  return [
    {
      id: 'user1',
      name: '张三',
      email: 'zhang.san@example.com',
      avatar: '',
      status: 'active',
      role: 'tenant_admin',
      tenantId: 'tenant1',
      tenantName: '示例公司A',
      phone: '+86-13812345678',
      department: '技术部',
      title: '技术总监',
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
      loginCount: 156,
      activityCount: 1024,
      permissionCount: 12,
      emailVerified: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30天前
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
    },
    {
      id: 'user2',
      name: '李四',
      email: 'li.si@example.com',
      avatar: '',
      status: 'active',
      role: 'manager',
      tenantId: 'tenant1',
      tenantName: '示例公司A',
      phone: '+86-13987654321',
      department: '销售部',
      title: '销售经理',
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
      loginCount: 89,
      activityCount: 456,
      permissionCount: 8,
      emailVerified: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20天前
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3小时前
    },
    {
      id: 'user3',
      name: '王五',
      email: 'wang.wu@example.com',
      avatar: '',
      status: 'suspended',
      role: 'user',
      tenantId: 'tenant2',
      tenantName: '示例公司B',
      phone: '',
      department: '客服部',
      title: '客服专员',
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3天前
      loginCount: 23,
      activityCount: 89,
      permissionCount: 4,
      emailVerified: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10天前
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
    },
    {
      id: 'admin',
      name: '系统管理员',
      email: 'admin@system.com',
      avatar: '',
      status: 'active',
      role: 'system_admin',
      tenantId: null,
      tenantName: '系统用户',
      phone: '+86-13800138000',
      department: '系统部',
      title: '系统管理员',
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5分钟前
      loginCount: 2045,
      activityCount: 8901,
      permissionCount: 50,
      emailVerified: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(), // 1年前
      updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10分钟前
    },
  ]
}

function generateMockUserStats() {
  return {
    total: 1248,
    active: 1156,
    suspended: 67,
    pending: 25,
    admins: 5,
    todayNew: 3,
    weeklyNew: 18,
    monthlyGrowth: '+12%',
  }
}

function generateMockUserActivities(userId: string) {
  return [
    {
      id: 'activity1',
      userId,
      action: '登录系统',
      resource: 'auth',
      timestamp: '5分钟前',
      location: '北京, 中国',
      status: 'success',
      description: '用户成功登录系统',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      id: 'activity2',
      userId,
      action: '修改个人资料',
      resource: 'profile',
      timestamp: '1小时前',
      location: '北京, 中国',
      status: 'success',
      description: '用户更新了个人头像',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      id: 'activity3',
      userId,
      action: '访问仪表板',
      resource: 'dashboard',
      timestamp: '2小时前',
      location: '北京, 中国',
      status: 'success',
      description: '用户查看了系统仪表板',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  ]
}

// 查询键
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  activities: (id: string) => [...userKeys.detail(id), 'activities'] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
}

/**
 * 获取用户列表
 */
export function useUsers(filters?: {
  search?: string
  status?: string
  role?: string
  tenantId?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800)) // 模拟网络延迟
      
      let users = generateMockUsers()
      
      // 应用筛选
      if (filters?.search) {
        const search = filters.search.toLowerCase()
        users = users.filter(user => 
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        )
      }
      
      if (filters?.status && filters.status !== 'all') {
        users = users.filter(user => user.status === filters.status)
      }
      
      if (filters?.role && filters.role !== 'all') {
        users = users.filter(user => user.role === filters.role)
      }
      
      if (filters?.tenantId && filters.tenantId !== 'all') {
        if (filters.tenantId === 'system') {
          users = users.filter(user => !user.tenantId)
        } else {
          users = users.filter(user => user.tenantId === filters.tenantId)
        }
      }
      
      return {
        data: users,
        stats: generateMockUserStats(),
        total: users.length,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20,
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
}

/**
 * 获取用户详情
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600))
      const users = generateMockUsers()
      const user = users.find(u => u.id === userId)
      
      if (!user) {
        throw new Error('用户不存在')
      }
      
      return {
        ...user,
        // 扩展用户详情
        businessLicense: user.role === 'tenant_admin' ? 'BL2023001234567890' : undefined,
        recentActivities: generateMockUserActivities(userId).slice(0, 3),
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取用户活动记录
 */
export function useUserActivities(userId: string) {
  return useQuery({
    queryKey: userKeys.activities(userId),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return generateMockUserActivities(userId)
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * 获取用户统计数据
 */
export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
      return generateMockUserStats()
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * 用户操作hooks
 */
export function useUserOperations() {
  const queryClient = useQueryClient()

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { id: userId, deleted: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('用户删除成功')
    },
    onError: () => {
      toast.error('删除用户失败')
    },
  })

  const suspendUser = useMutation({
    mutationFn: async (userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { id: userId, status: 'suspended' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.details() })
      toast.success('用户已暂停')
    },
    onError: () => {
      toast.error('暂停用户失败')
    },
  })

  const activateUser = useMutation({
    mutationFn: async (userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { id: userId, status: 'active' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.details() })
      toast.success('用户已激活')
    },
    onError: () => {
      toast.error('激活用户失败')
    },
  })

  const createUser = useMutation({
    mutationFn: async (userData: Record<string, unknown>) => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      return { id: 'user-' + Date.now(), ...userData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('用户创建成功')
    },
    onError: () => {
      toast.error('创建用户失败')
    },
  })

  const updateUser = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { id: userId, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.details() })
      toast.success('用户信息更新成功')
    },
    onError: () => {
      toast.error('更新用户信息失败')
    },
  })

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await new Promise(resolve => setTimeout(resolve, 900))
      return { id: userId, role }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.details() })
      toast.success('用户角色更新成功')
    },
    onError: () => {
      toast.error('更新用户角色失败')
    },
  })

  const resetPassword = useMutation({
    mutationFn: async (userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { id: userId, passwordReset: true }
    },
    onSuccess: () => {
      toast.success('密码重置成功，新密码已发送到用户邮箱')
    },
    onError: () => {
      toast.error('重置密码失败')
    },
  })

  return {
    deleteUser,
    suspendUser,
    activateUser,
    createUser,
    updateUser,
    updateUserRole,
    resetPassword,
  }
}

/**
 * 批量用户操作
 */
export function useBatchUserOperations() {
  const queryClient = useQueryClient()

  const batchDeleteUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return userIds.map(id => ({ id, deleted: true }))
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(`成功删除 ${userIds.length} 个用户`)
    },
    onError: () => {
      toast.error('批量删除用户失败')
    },
  })

  const batchSuspendUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return userIds.map(id => ({ id, status: 'suspended' }))
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(`成功暂停 ${userIds.length} 个用户`)
    },
    onError: () => {
      toast.error('批量暂停用户失败')
    },
  })

  const batchActivateUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return userIds.map(id => ({ id, status: 'active' }))
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(`成功激活 ${userIds.length} 个用户`)
    },
    onError: () => {
      toast.error('批量激活用户失败')
    },
  })

  return {
    batchDeleteUsers,
    batchSuspendUsers,
    batchActivateUsers,
  }
}

/**
 * 用户权限管理
 */
export function useUserPermissions(userId: string) {
  const queryClient = useQueryClient()

  const permissions = useQuery({
    queryKey: [...userKeys.detail(userId), 'permissions'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600))
      return [
        { id: 'perm1', name: '查看仪表板', resource: 'dashboard', action: 'read', granted: true },
        { id: 'perm2', name: '管理用户', resource: 'users', action: 'manage', granted: false },
        { id: 'perm3', name: '查看报告', resource: 'reports', action: 'read', granted: true },
        { id: 'perm4', name: '系统设置', resource: 'settings', action: 'write', granted: false },
      ]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const updatePermission = useMutation({
    mutationFn: async ({ permissionId, granted }: { permissionId: string; granted: boolean }) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { permissionId, granted }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...userKeys.detail(userId), 'permissions'] })
      toast.success('权限更新成功')
    },
    onError: () => {
      toast.error('权限更新失败')
    },
  })

  return {
    permissions: permissions.data || [],
    isLoading: permissions.isLoading,
    updatePermission,
  }
}

/**
 * 用户导出功能
 */
export function useUserExport() {
  const exportUsers = useCallback(async (
    filters?: Record<string, unknown>,
    format: 'csv' | 'xlsx' | 'json' = 'csv'
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟导出文件
      const data = generateMockUsers()
      const content = format === 'json' 
        ? JSON.stringify(data, null, 2)
        : 'id,name,email,status,role,tenantName\n' + 
          data.map(u => `${u.id},${u.name},${u.email},${u.status},${u.role},${u.tenantName}`).join('\n')
      
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_export_${Date.now()}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('用户数据导出成功')
    } catch {
      toast.error('导出用户数据失败')
    }
  }, [])

  return { exportUsers }
}