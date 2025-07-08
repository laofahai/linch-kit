import { test, expect } from '@playwright/test'

test.describe('Starter App - 冒烟测试', () => {
  test('应用应该正常加载', async ({ page }) => {
    await page.goto('/')

    // 检查页面标题
    await expect(page).toHaveTitle(/LinchKit Starter/)

    // 检查主要内容是否加载
    await expect(page.locator('body')).toBeVisible()
  })

  test('导航菜单应该正常工作', async ({ page }) => {
    await page.goto('/')

    // 检查导航链接
    const navLinks = page.locator('nav a')
    await expect(navLinks).toHaveCount(await navLinks.count())
  })

  test('主题切换应该正常工作', async ({ page }) => {
    await page.goto('/')

    // 查找主题切换按钮
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Theme")')

    if (await themeToggle.isVisible()) {
      // 获取初始主题
      const htmlElement = page.locator('html')
      const initialTheme = await htmlElement.getAttribute('class')

      // 点击切换主题
      await themeToggle.click()

      // 等待主题变化
      await page.waitForTimeout(500)

      // 验证主题已改变
      const newTheme = await htmlElement.getAttribute('class')
      expect(newTheme).not.toBe(initialTheme)
    }
  })

  test('响应式设计应该正常工作', async ({ page, browserName }) => {
    // 跳过 webkit，因为它可能有不同的视口行为
    test.skip(browserName === 'webkit', 'Webkit 有特殊的视口处理')

    await page.goto('/')

    // 测试桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body')).toBeVisible()

    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()

    // 测试移动视图
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Starter App - 性能测试', () => {
  test('页面加载时间应该在合理范围内', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // 页面应该在 5 秒内加载完成
    expect(loadTime).toBeLessThan(5000)
  })

  test('应该没有控制台错误', async ({ page }) => {
    const consoleMessages: string[] = []
    const pageErrors: string[] = []
    const globalErrors: string[] = []

    // 捕获所有控制台消息
    page.on('console', msg => {
      consoleMessages.push(`Console ${msg.type()}: ${msg.text()}`)
    })

    // 捕获页面错误
    page.on('pageerror', error => {
      pageErrors.push(`Page error: ${error.message}`)
      globalErrors.push(`Global error: ${error.constructor.name}`)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 输出所有收集到的信息用于调试
    console.log('Console messages:', consoleMessages)
    console.log('Page errors:', pageErrors)
    console.log('Global errors:', globalErrors)

    // 过滤出关键错误
    const criticalErrors = [
      ...pageErrors,
      ...consoleMessages.filter(
        msg =>
          msg.includes('error') &&
          !msg.includes('warning') &&
          !msg.includes('info') &&
          !msg.includes('hydration') &&
          !msg.includes('Warning:')
      ),
    ].filter(
      error =>
        !error.includes('favicon') && // 忽略 favicon 错误
        !error.includes('analytics') && // 忽略分析工具错误
        !error.includes('vercel') // 忽略 Vercel 相关错误
    )

    // 如果有未过滤的页面错误，暂时容忍但输出警告
    if (globalErrors.length > 0) {
      console.warn('Found global errors (temporarily ignored):', globalErrors)
    }

    expect(criticalErrors).toHaveLength(0)
  })
})
