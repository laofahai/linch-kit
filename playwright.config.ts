import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 * 用于部署前的自动化验证
 */
export default defineConfig({
  testDir: './e2e',
  /* 最大并行测试数 */
  fullyParallel: true,
  /* CI 环境下禁止重试失败的测试 */
  forbidOnly: !!process.env.CI,
  /* 重试次数 */
  retries: process.env.CI ? 2 : 0,
  /* 并行工作进程数 */
  workers: process.env.CI ? 1 : undefined,
  /* 测试报告配置 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  /* 全局测试配置 */
  use: {
    /* 基础 URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    /* 收集失败测试的追踪信息 */
    trace: 'on-first-retry',
    /* 截图配置 */
    screenshot: 'only-on-failure',
    /* 视频录制 */
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },

  /* 配置不同的测试项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 本地开发服务器配置 */
  webServer: {
    command: process.env.CI ? 'bun run build && bun run start' : 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
