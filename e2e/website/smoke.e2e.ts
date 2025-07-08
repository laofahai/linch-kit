import { test, expect } from '@playwright/test'

test.describe('Website - 冒烟测试', () => {
  test('首页应该正常加载', async ({ page }) => {
    await page.goto('/')

    // 检查页面标题
    await expect(page).toHaveTitle(/LinchKit/)

    // 检查主要内容
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('导航链接应该正常工作', async ({ page }) => {
    await page.goto('/')

    // 获取所有导航链接
    const navLinks = page.locator('nav a, header a')
    const linkCount = await navLinks.count()

    // 至少应该有一些导航链接
    expect(linkCount).toBeGreaterThan(0)

    // 测试第一个链接
    if (linkCount > 0) {
      const firstLink = navLinks.first()
      const href = await firstLink.getAttribute('href')

      if (href && !href.startsWith('http') && href !== '#') {
        await firstLink.click()
        await page.waitForLoadState('networkidle')

        // 验证导航成功
        expect(page.url()).toContain(href)
      }
    }
  })

  test('响应式布局应该正常工作', async ({ page }) => {
    await page.goto('/')

    // 测试不同视口尺寸
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.waitForTimeout(300) // 等待响应式调整

      // 验证内容在所有视口下都可见
      await expect(page.locator('body')).toBeVisible()

      // 截图以供后续审查
      await page.screenshot({
        path: `e2e/screenshots/website-${viewport.name.toLowerCase()}.png`,
        fullPage: true,
      })
    }
  })
})

test.describe('Website - SEO 测试', () => {
  test('应该有正确的 meta 标签', async ({ page }) => {
    await page.goto('/')

    // 检查基本 meta 标签
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description?.length).toBeGreaterThan(50)

    // 检查 Open Graph 标签
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()

    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .getAttribute('content')
    expect(ogDescription).toBeTruthy()
  })

  test('应该有正确的结构化数据', async ({ page }) => {
    await page.goto('/')

    // 检查是否有结构化数据
    const jsonLd = await page.locator('script[type="application/ld+json"]').count()

    // 如果有结构化数据，验证其格式
    if (jsonLd > 0) {
      const structuredData = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent()
      expect(() => JSON.parse(structuredData || '')).not.toThrow()
    }
  })
})
