import { test, expect } from '@playwright/test'

/**
 * LinchKit Starter 认证流程 E2E 测试
 * 测试用户认证的完整流程，包括登录、会话管理和权限控制
 */
test.describe('用户认证流程 E2E 测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前清理认证状态
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test.describe('登录流程', () => {
    test('应该显示登录页面', async ({ page }) => {
      await page.goto('/auth/login')

      // 检查登录表单元素
      await expect(page.locator('form')).toBeVisible()
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // 检查页面标题
      await expect(page).toHaveTitle(/Login|登录/)
    })

    test('应该验证表单输入', async ({ page }) => {
      await page.goto('/auth/login')

      // 尝试提交空表单
      await page.locator('button[type="submit"]').click()

      // 检查验证错误消息
      await expect(page.locator('text=邮箱是必需的')).toBeVisible()
      await expect(page.locator('text=密码是必需的')).toBeVisible()
    })

    test('应该处理无效凭据', async ({ page }) => {
      await page.goto('/auth/login')

      // 填写无效凭据
      await page.locator('input[type="email"]').fill('invalid@example.com')
      await page.locator('input[type="password"]').fill('wrongpassword')
      await page.locator('button[type="submit"]').click()

      // 等待错误消息
      await expect(page.locator('text=用户名或密码错误')).toBeVisible()
    })

    test('应该成功登录有效用户', async ({ page }) => {
      // 模拟 API 响应
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            },
            token: 'mock-jwt-token'
          })
        })
      })

      await page.goto('/auth/login')

      // 填写有效凭据
      await page.locator('input[type="email"]').fill('test@example.com')
      await page.locator('input[type="password"]').fill('password123')
      await page.locator('button[type="submit"]').click()

      // 应该重定向到仪表板
      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test.describe('会话管理', () => {
    test('应该保持用户会话', async ({ page }) => {
      // 设置模拟认证状态
      await page.goto('/')

      // 模拟已认证的 cookie
      await page.context().addCookies([
        {
          name: 'auth-token',
          value: 'mock-jwt-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true
        }
      ])

      // 模拟用户验证 API
      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          })
        })
      })

      // 访问受保护页面
      await page.goto('/dashboard')

      // 应该显示用户信息
      await expect(page.locator('text=Test User')).toBeVisible()
      await expect(page.locator('text=test@example.com')).toBeVisible()
    })

    test('应该处理会话过期', async ({ page }) => {
      // 设置过期的认证状态
      await page.context().addCookies([
        {
          name: 'auth-token',
          value: 'expired-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true
        }
      ])

      // 模拟认证失败 API
      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Token expired'
          })
        })
      })

      // 尝试访问受保护页面
      await page.goto('/dashboard')

      // 应该重定向到登录页面
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('应该支持令牌刷新', async ({ page }) => {
      // 设置即将过期的 token
      await page.context().addCookies([
        {
          name: 'auth-token',
          value: 'expiring-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
        },
        {
          name: 'refresh-token',
          value: 'valid-refresh-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
        }
      ])

      // 模拟令牌刷新 API
      await page.route('/api/auth/refresh', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'new-jwt-token',
            refreshToken: 'new-refresh-token'
          })
        })
      })

      // 模拟用户验证 API
      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          })
        })
      })

      await page.goto('/dashboard')

      // 应该成功访问页面（令牌已刷新）
      await expect(page.locator('text=Test User')).toBeVisible()
    })
  })

  test.describe('权限控制', () => {
    test('未认证用户应该被重定向到登录页面', async ({ page }) => {
      // 直接访问受保护页面
      await page.goto('/dashboard')

      // 应该重定向到登录页面
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('应该保护 API 路由', async ({ page }) => {
      // 尝试直接访问受保护的 API
      const response = await page.request.get('/api/dashboard/data')

      // 应该返回 401 未授权
      expect(response.status()).toBe(401)
    })

    test('已认证用户应该能访问受保护页面', async ({ page }) => {
      // 设置认证状态
      await page.context().addCookies([
        {
          name: 'auth-token',
          value: 'valid-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true
        }
      ])

      // 模拟 API 响应
      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          })
        })
      })

      await page.goto('/dashboard')

      // 应该能够访问页面
      await expect(page.locator('body')).toBeVisible()
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('登出流程', () => {
    test('应该成功登出并清理会话', async ({ page }) => {
      // 设置认证状态
      await page.context().addCookies([
        {
          name: 'auth-token',
          value: 'valid-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true
        }
      ])

      // 模拟登出 API
      await page.route('/api/auth/logout', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      await page.goto('/dashboard')

      // 查找并点击登出按钮
      const logoutButton = page.locator('button:has-text("登出"), button:has-text("Logout")')
      await logoutButton.click()

      // 应该重定向到首页或登录页面
      await expect(page).toHaveURL(/\/|\/auth\/login/)

      // 验证 cookie 已清理
      const cookies = await page.context().cookies()
      const authCookie = cookies.find(cookie => cookie.name === 'auth-token')
      expect(authCookie).toBeUndefined()
    })
  })

  test.describe('错误处理', () => {
    test('应该处理网络错误', async ({ page }) => {
      // 模拟网络错误
      await page.route('/api/auth/login', async route => {
        await route.abort('failed')
      })

      await page.goto('/auth/login')

      await page.locator('input[type="email"]').fill('test@example.com')
      await page.locator('input[type="password"]').fill('password123')
      await page.locator('button[type="submit"]').click()

      // 应该显示网络错误消息
      await expect(page.locator('text=网络连接错误')).toBeVisible()
    })

    test('应该处理服务器错误', async ({ page }) => {
      // 模拟服务器错误
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        })
      })

      await page.goto('/auth/login')

      await page.locator('input[type="email"]').fill('test@example.com')
      await page.locator('input[type="password"]').fill('password123')
      await page.locator('button[type="submit"]').click()

      // 应该显示服务器错误消息
      await expect(page.locator('text=服务器错误')).toBeVisible()
    })
  })

  test.describe('用户体验', () => {
    test('登录表单应该有加载状态', async ({ page }) => {
      // 模拟慢速 API 响应
      await page.route('/api/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: '1', email: 'test@example.com' },
            token: 'mock-token'
          })
        })
      })

      await page.goto('/auth/login')

      await page.locator('input[type="email"]').fill('test@example.com')
      await page.locator('input[type="password"]').fill('password123')
      
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // 应该显示加载指示器
      await expect(page.locator('text=登录中...')).toBeVisible()
      await expect(submitButton).toBeDisabled()
    })

    test('应该在登录后显示欢迎消息', async ({ page }) => {
      // 模拟成功登录
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            },
            token: 'mock-jwt-token'
          })
        })
      })

      await page.goto('/auth/login')

      await page.locator('input[type="email"]').fill('test@example.com')
      await page.locator('input[type="password"]').fill('password123')
      await page.locator('button[type="submit"]').click()

      // 应该显示欢迎消息
      await expect(page.locator('text=欢迎, Test User')).toBeVisible()
    })
  })
})