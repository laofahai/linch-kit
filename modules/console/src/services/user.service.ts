/**
 * 用户管理服务
 * 
 * 基于 @linch-kit/crud 和 @linch-kit/auth 的用户管理业务逻辑
 * 
 * TODO: 当 CRUD 和 Auth API 稳定后重新实现
 */

import { z } from 'zod'

/**
 * 用户创建输入验证
 */
export const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).optional(),
  roles: z.array(z.string()).default([]),
  tenantId: z.string().optional(),
  settings: z.record(z.any()).optional()
})

/**
 * 用户更新输入验证
 */
export const UpdateUserInput = CreateUserInput.partial()

export type CreateUserInput = z.infer<typeof CreateUserInput>
export type UpdateUserInput = z.infer<typeof UpdateUserInput>

/**
 * 用户管理服务类 (简化存根实现)
 */
export class UserService {
  /**
   * 创建用户
   */
  async createUser(input: CreateUserInput): Promise<any> {
    // TODO: 实现真实的用户创建逻辑
    return { id: 'user-' + Date.now(), ...input }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<any> {
    // TODO: 实现真实的用户更新逻辑
    return { id: userId, ...input }
  }

  /**
   * 获取用户详情
   */
  async getUser(userId: string): Promise<any> {
    // TODO: 实现真实的用户查询逻辑
    return { id: userId, name: 'Demo User' }
  }

  /**
   * 查询用户列表
   */
  async listUsers(): Promise<any[]> {
    // TODO: 实现真实的用户列表查询逻辑
    return []
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<any> {
    // TODO: 实现真实的用户删除逻辑
    return { id: userId, deleted: true }
  }
}

/**
 * 导出用户服务实例
 */
export const userService = new UserService()