import { test, expect } from '@playwright/test'

test.describe('Demo App - 冒烟测试', () => {
  test('应用应该正常加载', async ({ page }) => {
    await page.goto('/')

    // 检查页面标题
    await expect(page).toHaveTitle(/LinchKit Demo/)

    // 检查演示导航
    await expect(page.locator('nav')).toBeVisible()
  })

  test('各个演示页面应该可访问', async ({ page }) => {
    const demoPages = [
      { path: '/auth', title: 'Auth' },
      { path: '/schema', title: 'Schema' },
      { path: '/config', title: 'Config' },
      { path: '/i18n', title: 'I18n' },
      { path: '/trpc', title: 'tRPC' },
      { path: '/plugins', title: 'Plugins' },
    ]

    for (const demoPage of demoPages) {
      await page.goto(demoPage.path)

      // 验证页面加载
      await expect(page.locator('h1, h2').first()).toContainText(demoPage.title)

      // 验证没有错误
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.waitForLoadState('networkidle')

      // 过滤掉可接受的警告
      const criticalErrors = errors.filter(
        error => !error.includes('hydration') && !error.includes('Warning:')
      )

      expect(criticalErrors).toHaveLength(0)
    }
  })

  test('认证功能应该正常工作', async ({ page }) => {
    await page.goto('/auth')

    // 检查登录表单
    const loginForm = page.locator('form').first()

    if (await loginForm.isVisible()) {
      // 检查表单字段
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    }
  })

  test('国际化切换应该正常工作', async ({ page }) => {
    await page.goto('/i18n')

    // 查找语言切换器
    const langSwitcher = page.locator('select, button').filter({ hasText: /语言|Language|zh|en/ })

    if (await langSwitcher.isVisible()) {
      // 记录初始文本
      const initialText = await page.locator('body').textContent()

      // 切换语言
      await langSwitcher.click()

      // 如果是下拉菜单，选择另一个选项
      const options = page.locator('option, [role="option"]')
      if ((await options.count()) > 1) {
        await options.nth(1).click()
      }

      // 等待语言切换
      await page.waitForTimeout(500)

      // 验证文本已改变
      const newText = await page.locator('body').textContent()
      expect(newText).not.toBe(initialText)
    }
  })
})

test.describe('Demo App - API 测试', () => {
  test('tRPC API 应该响应', async ({ page }) => {
    await page.goto('/trpc')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 检查是否有 API 调用
    const apiCalls = await page.evaluate(() => {
      return window.performance
        .getEntriesByType('resource')
        .filter(entry => entry.name.includes('trpc') || entry.name.includes('api')).length
    })

    expect(apiCalls).toBeGreaterThan(0)
  })

  test('配置管理应该正常工作', async ({ page }) => {
    await page.goto('/config')

    // 检查配置展示
    await expect(page.locator('pre, code, [data-testid="config-display"]').first()).toBeVisible()
  })
})
