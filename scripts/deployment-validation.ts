#!/usr/bin/env bun
/**
 * 部署验证脚本
 * 使用 Playwright 对部署的应用进行自动化验证
 */

import { chromium } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ValidationResult {
  app: string;
  url: string;
  status: 'success' | 'failure';
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
  performanceMetrics?: {
    loadTime: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
}

async function validateDeployment(appName: string, url: string): Promise<ValidationResult> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const result: ValidationResult = {
    app: appName,
    url,
    status: 'success',
    checks: [],
  };

  try {
    // 1. 检查应用是否可访问
    const startTime = Date.now();
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    result.performanceMetrics = { loadTime };
    
    result.checks.push({
      name: '应用可访问性',
      passed: response?.status() === 200,
      message: `HTTP 状态码: ${response?.status()}`,
    });

    // 2. 检查页面标题
    const title = await page.title();
    result.checks.push({
      name: '页面标题',
      passed: title.length > 0,
      message: `标题: ${title}`,
    });

    // 3. 检查主要内容加载
    const hasContent = await page.locator('body').isVisible();
    result.checks.push({
      name: '主要内容加载',
      passed: hasContent,
      message: hasContent ? '内容已加载' : '内容未加载',
    });

    // 4. 检查控制台错误
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = errors.filter(error => 
      !error.includes('hydration') && 
      !error.includes('Warning:')
    );
    
    result.checks.push({
      name: '控制台错误',
      passed: criticalErrors.length === 0,
      message: criticalErrors.length > 0 ? `发现 ${criticalErrors.length} 个错误` : '无错误',
    });

    // 5. 性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime,
      };
    });
    
    if (result.performanceMetrics) {
      result.performanceMetrics.firstContentfulPaint = metrics.firstContentfulPaint;
      result.performanceMetrics.largestContentfulPaint = metrics.largestContentfulPaint;
    }
    
    result.checks.push({
      name: '性能指标',
      passed: loadTime < 5000,
      message: `加载时间: ${loadTime}ms, FCP: ${metrics.firstContentfulPaint?.toFixed(0)}ms`,
    });

    // 6. 移动端兼容性
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileVisible = await page.locator('body').isVisible();
    
    result.checks.push({
      name: '移动端兼容性',
      passed: mobileVisible,
      message: mobileVisible ? '移动端显示正常' : '移动端显示异常',
    });

  } catch (error) {
    result.status = 'failure';
    result.checks.push({
      name: '验证过程',
      passed: false,
      message: `错误: ${error}`,
    });
  } finally {
    await browser.close();
  }

  // 判断总体状态
  if (result.checks.some(check => !check.passed)) {
    result.status = 'failure';
  }

  return result;
}

async function main() {
  console.log('🚀 开始部署验证...\n');

  const deployments = [
    { name: 'Starter App', url: process.env.STARTER_APP_URL || 'https://linchkit-starter.vercel.app' },
    { name: 'Website', url: process.env.WEBSITE_URL || 'https://linchkit.vercel.app' },
    { name: 'Demo App', url: process.env.DEMO_APP_URL || 'https://linchkit-demo.vercel.app' },
  ];

  const results: ValidationResult[] = [];

  for (const deployment of deployments) {
    console.log(`📋 验证 ${deployment.name} (${deployment.url})...`);
    const result = await validateDeployment(deployment.name, deployment.url);
    results.push(result);

    // 打印结果
    console.log(`\n📊 ${deployment.name} 验证结果:`);
    result.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.message || (check.passed ? '通过' : '失败')}`);
    });

    if (result.performanceMetrics) {
      console.log(`\n⚡ 性能指标:`);
      console.log(`  - 总加载时间: ${result.performanceMetrics.loadTime}ms`);
      if (result.performanceMetrics.firstContentfulPaint) {
        console.log(`  - 首次内容绘制 (FCP): ${result.performanceMetrics.firstContentfulPaint.toFixed(0)}ms`);
      }
    }
    console.log('');
  }

  // 生成总结报告
  console.log('\n📈 部署验证总结:');
  const failedApps = results.filter(r => r.status === 'failure');
  
  if (failedApps.length === 0) {
    console.log('✅ 所有应用部署验证通过！');
  } else {
    console.log(`❌ ${failedApps.length} 个应用验证失败:`);
    failedApps.forEach(app => {
      console.log(`  - ${app.app}`);
      const failedChecks = app.checks.filter(c => !c.passed);
      failedChecks.forEach(check => {
        console.log(`    • ${check.name}: ${check.message}`);
      });
    });
    process.exit(1);
  }
}

// 运行验证
main().catch(console.error);