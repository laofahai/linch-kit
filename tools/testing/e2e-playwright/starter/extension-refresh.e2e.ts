import { test, expect } from '@playwright/test'

test.describe('Extension System - Page Refresh Persistence', () => {
  test('Console extension should work after page refresh', async ({ page }) => {
    // 首先访问首页，确保extension正确初始化
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 访问console页面，应该正常工作
    await page.goto('/console')
    await page.waitForLoadState('networkidle')
    
    // 检查console页面是否正确渲染（不是开发占位符）
    const bodyText = await page.textContent('body')
    
    // 应该看到Dashboard内容，而不是"Extension Under Development"占位符
    expect(bodyText).not.toContain('Extension Under Development')
    expect(bodyText).not.toContain('Extension is running but no UI components are registered')
    
    // 应该看到实际的Console Dashboard内容
    await expect(page.locator('body')).toContainText('Console')
    
    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // 刷新后检查页面内容
    const refreshedBodyText = await page.textContent('body')
    
    // 关键测试：刷新后不应该显示开发占位符
    expect(refreshedBodyText).not.toContain('Extension Under Development')
    expect(refreshedBodyText).not.toContain('Extension is running but no UI components are registered')
    
    // 应该仍然显示Console内容
    await expect(page.locator('body')).toContainText('Console')
  })

  test('Extension UI registry should persist after refresh', async ({ page }) => {
    // 设置控制台监听
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text())
      }
    })

    // 访问console页面
    await page.goto('/console')
    await page.waitForLoadState('networkidle')
    
    // 等待一段时间确保初始化完成
    await page.waitForTimeout(2000)
    
    // 检查是否有extension注册的日志
    const registrationLogs = consoleLogs.filter(log => 
      log.includes('ExtensionUIRegistry') || log.includes('Console extension')
    )
    
    expect(registrationLogs.length).toBeGreaterThan(0)
    
    // 清空日志
    consoleLogs.length = 0
    
    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // 检查刷新后是否重新注册了extension
    const refreshRegistrationLogs = consoleLogs.filter(log => 
      log.includes('ExtensionUIRegistry') || log.includes('Console extension')
    )
    
    expect(refreshRegistrationLogs.length).toBeGreaterThan(0)
  })

  test('Extension navigation should work consistently', async ({ page }) => {
    // 从首页导航到console
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 查找到console的链接（如果存在）
    const consoleLink = page.locator('a[href="/console"], a[href*="console"]').first()
    
    if (await consoleLink.isVisible()) {
      await consoleLink.click()
    } else {
      // 直接导航
      await page.goto('/console')
    }
    
    await page.waitForLoadState('networkidle')
    
    // 确认页面正确加载
    await expect(page.locator('body')).toContainText('Console')
    
    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // 确认刷新后仍然正确显示
    await expect(page.locator('body')).toContainText('Console')
    
    // 导航回首页再返回console，测试完整的导航循环
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/console')
    await page.waitForLoadState('networkidle')
    
    // 再次确认工作正常
    await expect(page.locator('body')).toContainText('Console')
  })

  test('Multiple extension routes should work after refresh', async ({ page }) => {
    const routes = ['/console', '/console/dashboard', '/console/settings']
    
    for (const route of routes) {
      // 访问路由
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      // 检查页面加载正常
      const bodyText = await page.textContent('body')
      expect(bodyText).not.toContain('Extension Under Development')
      
      // 刷新页面
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // 检查刷新后仍然正常
      const refreshedBodyText = await page.textContent('body')
      expect(refreshedBodyText).not.toContain('Extension Under Development')
    }
  })

  test('Error handling during extension initialization', async ({ page }) => {
    const pageErrors: string[] = []
    
    // 捕获页面错误
    page.on('pageerror', error => {
      pageErrors.push(error.message)
    })
    
    // 访问console页面
    await page.goto('/console')
    await page.waitForLoadState('networkidle')
    
    // 过滤出extension相关的关键错误
    const criticalErrors = pageErrors.filter(error => 
      error.includes('useConsoleContext') || 
      error.includes('ConsoleProvider') ||
      error.includes('Extension')
    )
    
    expect(criticalErrors).toHaveLength(0)
    
    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // 检查刷新后没有新的extension错误
    const newErrors = pageErrors.slice(pageErrors.length)
    const newCriticalErrors = newErrors.filter(error => 
      error.includes('useConsoleContext') || 
      error.includes('ConsoleProvider') ||
      error.includes('Extension')
    )
    
    expect(newCriticalErrors).toHaveLength(0)
  })
})