/**
 * 登录API端点 - 集成Supabase用户存储
 */

import { createServerJWTAuthServiceFromEnv, createSupabaseUserService } from '@linch-kit/auth/server'
import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '../../../../lib/supabase'

// 创建认证服务实例（懒加载避免重复实例化）
let authService: ReturnType<typeof createServerJWTAuthServiceFromEnv> | null = null
let supabaseUserService: ReturnType<typeof createSupabaseUserService> | null = null

function getAuthService() {
  authService ??= createServerJWTAuthServiceFromEnv({
    accessTokenExpiry: process.env['ACCESS_TOKEN_EXPIRY'] ?? '15m',
    refreshTokenExpiry: process.env['REFRESH_TOKEN_EXPIRY'] ?? '7d',
    algorithm: 'HS256',
    issuer: 'linch-kit-starter',
    audience: 'linch-kit-starter-app'
  })
  return authService
}

function getSupabaseUserService() {
  supabaseUserService ??= createSupabaseUserService(supabase, logger)
  return supabaseUserService
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    logger.info('用户登录请求', {
      service: 'login-api',
      email: email?.toString().slice(0, 3) + '***', // 脱敏信息
      hasPassword: !!password
    })

    // 使用真实的JWT认证服务
    const authService = getAuthService()
    
    // 构造认证请求
    const authRequest = {
      provider: 'credentials',
      credentials: {
        email,
        password
      }
    }
    
    // 使用认证服务进行身份验证
    const result = await authService.authenticate(authRequest)

    if (result.success && result.user) {
      try {
        // 认证成功后，将用户信息存储到Supabase
        const userData = {
          email: result.user.email,
          name: result.user.name ?? 'User'
        }
        
        const supabaseUser = await getSupabaseUserService().upsertUser(userData)
        
        logger.info('用户登录成功，已同步到Supabase', {
          service: 'login-api',
          userId: result.user.id,
          supabaseUserId: supabaseUser['id'],
          email: email?.toString().slice(0, 3) + '***'
        })

        // 返回成功结果，包含Supabase用户ID
        return NextResponse.json({
          ...result,
          user: {
            ...result.user,
            supabaseId: supabaseUser['id']
          }
        })
      } catch (supabaseError) {
        logger.warn('用户认证成功但Supabase同步失败', {
          service: 'login-api',
          userId: result.user.id,
          email: email?.toString().slice(0, 3) + '***',
          error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
        })
        
        // 即使Supabase同步失败，也返回认证成功的结果
        return NextResponse.json(result)
      }
    } else {
      logger.warn('用户登录失败', {
        service: 'login-api',
        email: email?.toString().slice(0, 3) + '***',
        error: result.error
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('登录API发生错误', error instanceof Error ? error : undefined, {
      service: 'login-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: '登录服务不可用，请稍后再试' },
      { status: 500 }
    )
  }
}