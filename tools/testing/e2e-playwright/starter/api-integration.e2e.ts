import { test, expect } from '@playwright/test'

/**
 * LinchKit Starter API 集成 E2E 测试
 * 测试前端与后端 API 的完整集成，包括 tRPC、REST API 和实时功能
 */
test.describe('API 集成 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {
    // 设置认证状态
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: 'test-jwt-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true
      }
    ])

    // 模拟用户认证 API
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
  })

  test.describe('tRPC 集成', () => {
    test('应该成功调用 tRPC 查询', async ({ page }) => {
      // 模拟 tRPC 查询响应
      await page.route('/api/trpc/**', async route => {
        const url = route.request().url()
        if (url.includes('user.profile')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              result: {
                data: {
                  id: '1',
                  name: 'Test User',
                  email: 'test@example.com',
                  createdAt: new Date().toISOString()
                }
              }
            })
          })
        }
      })

      await page.goto('/dashboard/profile')

      // 验证 tRPC 查询数据是否正确显示
      await expect(page.locator('text=Test User')).toBeVisible()
      await expect(page.locator('text=test@example.com')).toBeVisible()
    })

    test('应该处理 tRPC 查询错误', async ({ page }) => {
      // 模拟 tRPC 错误响应
      await page.route('/api/trpc/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Internal server error',
              code: 'INTERNAL_SERVER_ERROR'
            }
          })
        })
      })

      await page.goto('/dashboard/profile')

      // 验证错误处理
      await expect(page.locator('text=加载失败')).toBeVisible()
      await expect(page.locator('text=重试')).toBeVisible()
    })

    test('应该支持 tRPC 变更操作', async ({ page }) => {
      let mutationCalled = false

      // 模拟 tRPC 变更响应
      await page.route('/api/trpc/**', async route => {
        const url = route.request().url()
        const method = route.request().method()
        
        if (method === 'POST' && url.includes('user.updateProfile')) {
          mutationCalled = true
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              result: {
                data: {
                  id: '1',
                  name: 'Updated User',
                  email: 'updated@example.com'
                }
              }
            })
          })
        }
      })

      await page.goto('/dashboard/profile/edit')

      // 填写表单并提交
      await page.locator('input[name="name"]').fill('Updated User')
      await page.locator('input[name="email"]').fill('updated@example.com')
      await page.locator('button:has-text("保存")').click()

      // 验证变更操作被调用
      expect(mutationCalled).toBe(true)

      // 验证成功消息
      await expect(page.locator('text=更新成功')).toBeVisible()
    })
  })

  test.describe('REST API 集成', () => {
    test('应该正确处理 REST API 响应', async ({ page }) => {
      // 模拟 REST API 响应
      await page.route('/api/dashboard/stats', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: 150,
            posts: 350,
            views: 12500,
            revenue: 5000
          })
        })
      })

      await page.goto('/dashboard')

      // 验证统计数据显示
      await expect(page.locator('text=150')).toBeVisible() // 用户数
      await expect(page.locator('text=350')).toBeVisible() // 帖子数
      await expect(page.locator('text=12,500')).toBeVisible() // 浏览数
    })

    test('应该处理 API 认证错误', async ({ page }) => {
      // 模拟 401 认证错误
      await page.route('/api/dashboard/stats', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized'
          })
        })
      })

      await page.goto('/dashboard')

      // 应该重定向到登录页面或显示认证错误
      await expect(page.locator('text=认证失败')).toBeVisible()
    })

    test('应该支持分页 API', async ({ page }) => {
      let currentPage = 1

      // 模拟分页 API
      await page.route('/api/posts**', async route => {
        const url = new URL(route.request().url())
        const page_param = url.searchParams.get('page') || '1'
        currentPage = parseInt(page_param)

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 10 }, (_, i) => ({
              id: (currentPage - 1) * 10 + i + 1,
              title: `Post ${(currentPage - 1) * 10 + i + 1}`,
              content: `Content for post ${(currentPage - 1) * 10 + i + 1}`
            })),
            pagination: {
              page: currentPage,
              limit: 10,
              total: 100,
              hasNext: currentPage < 10,
              hasPrev: currentPage > 1
            }
          })
        })
      })

      await page.goto('/dashboard/posts')

      // 验证第一页数据
      await expect(page.locator('text=Post 1')).toBeVisible()

      // 点击下一页
      await page.locator('button:has-text("下一页")').click()

      // 验证第二页数据
      await expect(page.locator('text=Post 11')).toBeVisible()
    })
  })

  test.describe('表单提交集成', () => {
    test('应该成功提交表单数据', async ({ page }) => {
      let formSubmitted = false
      let submittedData: any = null

      // 模拟表单提交 API
      await page.route('/api/posts', async route => {
        if (route.request().method() === 'POST') {
          formSubmitted = true
          submittedData = await route.request().postDataJSON()
          
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '123',
              ...submittedData,
              createdAt: new Date().toISOString()
            })
          })
        }
      })

      await page.goto('/dashboard/posts/create')

      // 填写表单
      await page.locator('input[name="title"]').fill('Test Post')
      await page.locator('textarea[name="content"]').fill('This is test content')
      await page.locator('select[name="category"]').selectOption('tech')

      // 提交表单
      await page.locator('button[type="submit"]').click()

      // 验证提交
      expect(formSubmitted).toBe(true)
      expect(submittedData.title).toBe('Test Post')
      expect(submittedData.content).toBe('This is test content')
      expect(submittedData.category).toBe('tech')

      // 验证成功反馈
      await expect(page.locator('text=创建成功')).toBeVisible()
    })

    test('应该处理表单验证错误', async ({ page }) => {
      // 模拟验证错误响应
      await page.route('/api/posts', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              errors: {
                title: ['标题不能为空'],
                content: ['内容长度至少10个字符']
              }
            })
          })
        }
      })

      await page.goto('/dashboard/posts/create')

      // 提交空表单
      await page.locator('button[type="submit"]').click()

      // 验证错误消息显示
      await expect(page.locator('text=标题不能为空')).toBeVisible()
      await expect(page.locator('text=内容长度至少10个字符')).toBeVisible()
    })
  })

  test.describe('文件上传集成', () => {
    test('应该支持文件上传', async ({ page }) => {
      let fileUploaded = false

      // 模拟文件上传 API
      await page.route('/api/upload', async route => {
        if (route.request().method() === 'POST') {
          fileUploaded = true
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              url: '/uploads/test-file.jpg',
              filename: 'test-file.jpg',
              size: 1024
            })
          })
        }
      })

      await page.goto('/dashboard/posts/create')

      // 上传文件
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })

      // 验证上传
      expect(fileUploaded).toBe(true)

      // 验证上传成功反馈
      await expect(page.locator('text=上传成功')).toBeVisible()
      await expect(page.locator('img[src="/uploads/test-file.jpg"]')).toBeVisible()
    })

    test('应该处理文件上传错误', async ({ page }) => {
      // 模拟上传失败
      await page.route('/api/upload', async route => {
        await route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({
            error: '文件大小超出限制'
          })
        })
      })

      await page.goto('/dashboard/posts/create')

      // 上传过大文件
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'large-file.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(10 * 1024 * 1024) // 10MB
      })

      // 验证错误消息
      await expect(page.locator('text=文件大小超出限制')).toBeVisible()
    })
  })

  test.describe('实时功能测试', () => {
    test('应该支持 WebSocket 连接', async ({ page, context }) => {
      let wsConnected = false

      // 监听 WebSocket 连接
      page.on('websocket', ws => {
        wsConnected = true
        ws.on('framesent', event => {
          console.log('WebSocket frame sent:', event.payload)
        })
        ws.on('framereceived', event => {
          console.log('WebSocket frame received:', event.payload)
        })
      })

      await page.goto('/dashboard/live')

      // 等待 WebSocket 连接建立
      await page.waitForTimeout(2000)

      // 验证 WebSocket 连接
      expect(wsConnected).toBe(true)

      // 验证实时状态指示器
      await expect(page.locator('text=已连接')).toBeVisible()
    })

    test('应该处理 WebSocket 断开重连', async ({ page }) => {
      await page.goto('/dashboard/live')

      // 模拟网络断开
      await page.evaluate(() => {
        // 强制关闭 WebSocket 连接
        if (window.ws) {
          window.ws.close()
        }
      })

      // 验证断开状态
      await expect(page.locator('text=连接断开')).toBeVisible()

      // 等待自动重连
      await page.waitForTimeout(3000)

      // 验证重连成功
      await expect(page.locator('text=已连接')).toBeVisible()
    })
  })

  test.describe('缓存和性能', () => {
    test('应该正确处理 API 缓存', async ({ page }) => {
      let apiCallCount = 0

      // 监听 API 调用
      await page.route('/api/dashboard/stats', async route => {
        apiCallCount++
        await route.fulfill({
          status: 200,
          headers: {
            'Cache-Control': 'max-age=300' // 5分钟缓存
          },
          contentType: 'application/json',
          body: JSON.stringify({
            users: 150,
            posts: 350
          })
        })
      })

      // 首次访问
      await page.goto('/dashboard')
      await expect(page.locator('text=150')).toBeVisible()

      // 刷新页面
      await page.reload()
      await expect(page.locator('text=150')).toBeVisible()

      // 验证缓存生效（API 只调用一次）
      expect(apiCallCount).toBe(1)
    })

    test('应该支持 API 预加载', async ({ page }) => {
      let preloadApiCalled = false

      // 监听预加载 API
      await page.route('/api/posts/popular', async route => {
        preloadApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, title: 'Popular Post 1' },
            { id: 2, title: 'Popular Post 2' }
          ])
        })
      })

      await page.goto('/dashboard')

      // 悬停在链接上触发预加载
      await page.locator('a[href="/dashboard/posts"]').hover()

      // 等待预加载完成
      await page.waitForTimeout(1000)

      // 验证预加载 API 被调用
      expect(preloadApiCalled).toBe(true)

      // 点击链接，数据应该立即显示
      await page.locator('a[href="/dashboard/posts"]').click()
      await expect(page.locator('text=Popular Post 1')).toBeVisible()
    })
  })

  test.describe('错误恢复', () => {
    test('应该支持 API 重试机制', async ({ page }) => {
      let attemptCount = 0

      // 模拟前两次失败，第三次成功
      await page.route('/api/dashboard/stats', async route => {
        attemptCount++
        
        if (attemptCount < 3) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              users: 150,
              posts: 350
            })
          })
        }
      })

      await page.goto('/dashboard')

      // 验证重试后数据最终加载成功
      await expect(page.locator('text=150')).toBeVisible()
      expect(attemptCount).toBe(3)
    })

    test('应该优雅处理 API 超时', async ({ page }) => {
      // 模拟 API 超时
      await page.route('/api/dashboard/stats', async route => {
        // 延迟响应超过超时限制
        await new Promise(resolve => setTimeout(resolve, 10000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ users: 150 })
        })
      })

      await page.goto('/dashboard')

      // 验证超时处理
      await expect(page.locator('text=请求超时')).toBeVisible()
      await expect(page.locator('button:has-text("重试")')).toBeVisible()
    })
  })
})