/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { render, screen, act, renderHook } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { PageLoadingProvider, usePageLoading, PerformanceMonitor } from '../../react/performance-provider'

// Mock Logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

jest.mock('../../logger-client', () => ({
  Logger: mockLogger,
}))

// Helper component for testing usePageLoading hook
const TestComponent = () => {
  const { metrics, startLoading, stopLoading, recordInteraction } = usePageLoading()
  
  return (
    <div>
      <div data-testid="load-time">加载时间: {metrics.loadTime}ms</div>
      <div data-testid="render-time">渲染时间: {metrics.renderTime}ms</div>
      <div data-testid="loading-status">{metrics.isLoading ? '加载中' : '就绪'}</div>
      <button data-testid="start-loading" onClick={startLoading}>开始加载</button>
      <button data-testid="stop-loading" onClick={stopLoading}>停止加载</button>
      <button data-testid="record-interaction" onClick={() => recordInteraction('button-click')}>
        记录交互
      </button>
    </div>
  )
}

describe('PageLoadingProvider', () => {
  beforeEach(() => {
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByType: jest.fn(() => [
          {
            loadEventEnd: 1000,
            loadEventStart: 500,
            domContentLoadedEventEnd: 800,
            domContentLoadedEventStart: 600,
            fetchStart: 100,
          },
        ]),
      },
      configurable: true,
    })

    // Mock document.readyState
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    })

    // Clear mock calls
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('应该提供性能指标上下文', () => {
    render(
      <PageLoadingProvider>
        <TestComponent />
      </PageLoadingProvider>
    )

    expect(screen.getByTestId('load-time')).toBeInTheDocument()
    expect(screen.getByTestId('render-time')).toBeInTheDocument()
    expect(screen.getByTestId('loading-status')).toHaveTextContent('就绪')
  })

  it('应该在组件外使用时抛出错误', () => {
    expect(() => {
      renderHook(() => usePageLoading())
    }).toThrow('usePageLoading must be used within a PageLoadingProvider')
  })

  it('应该正确处理加载状态变化', async () => {
    const user = userEvent.setup()
    
    render(
      <PageLoadingProvider>
        <TestComponent />
      </PageLoadingProvider>
    )

    const startButton = screen.getByTestId('start-loading')
    const stopButton = screen.getByTestId('stop-loading')
    const loadingStatus = screen.getByTestId('loading-status')

    // 初始状态应该是就绪
    expect(loadingStatus).toHaveTextContent('就绪')

    // 开始加载
    await act(async () => {
      await user.click(startButton)
    })

    expect(loadingStatus).toHaveTextContent('加载中')

    // 停止加载
    await act(async () => {
      await user.click(stopButton)
    })

    expect(loadingStatus).toHaveTextContent('就绪')
    
    // 验证Logger被调用
    expect(mockLogger.info).toHaveBeenCalledWith(
      '页面加载完成',
      expect.objectContaining({
        loadTime: expect.any(Number),
        renderTime: expect.any(Number),
        timestamp: expect.any(String),
      })
    )
  })

  it('应该记录用户交互', async () => {
    const user = userEvent.setup()
    
    render(
      <PageLoadingProvider>
        <TestComponent />
      </PageLoadingProvider>
    )

    const interactionButton = screen.getByTestId('record-interaction')

    await act(async () => {
      await user.click(interactionButton)
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      '用户交互',
      expect.objectContaining({
        action: 'button-click',
        interactionTime: expect.any(Number),
        timestamp: expect.any(String),
      })
    )
  })

  it('应该在页面加载完成时记录性能', () => {
    render(
      <PageLoadingProvider>
        <TestComponent />
      </PageLoadingProvider>
    )

    // 验证页面加载性能被记录
    expect(mockLogger.info).toHaveBeenCalledWith(
      '页面加载性能',
      expect.objectContaining({
        loadTime: expect.any(Number),
        renderTime: expect.any(Number),
        domContentLoaded: expect.any(Number),
        firstContentfulPaint: expect.any(Number),
        url: expect.any(String),
        userAgent: expect.any(String),
        timestamp: expect.any(String),
      })
    )
  })

  it('应该处理没有performance API的环境', () => {
    // 移除performance API
    Object.defineProperty(window, 'performance', {
      value: undefined,
      configurable: true,
    })

    expect(() => {
      render(
        <PageLoadingProvider>
          <TestComponent />
        </PageLoadingProvider>
      )
    }).not.toThrow()
  })

  it('应该处理document.readyState不是complete的情况', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    })

    const mockAddEventListener = jest.fn()
    const mockRemoveEventListener = jest.fn()

    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
      configurable: true,
    })

    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
      configurable: true,
    })

    const { unmount } = render(
      <PageLoadingProvider>
        <TestComponent />
      </PageLoadingProvider>
    )

    expect(mockAddEventListener).toHaveBeenCalledWith('load', expect.any(Function))

    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('load', expect.any(Function))
  })
})

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV
    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })
  })

  it('应该在开发环境显示性能监控器', () => {
    process.env.NODE_ENV = 'development'

    render(
      <PageLoadingProvider>
        <PerformanceMonitor />
      </PageLoadingProvider>
    )

    expect(screen.getByText('加载时间:')).toBeInTheDocument()
    expect(screen.getByText('渲染时间:')).toBeInTheDocument()
    expect(screen.getByText(/就绪|加载中/)).toBeInTheDocument()
  })

  it('应该在生产环境隐藏性能监控器', () => {
    process.env.NODE_ENV = 'production'

    render(
      <PageLoadingProvider>
        <PerformanceMonitor />
      </PageLoadingProvider>
    )

    expect(screen.queryByText('加载时间:')).not.toBeInTheDocument()
    expect(screen.queryByText('渲染时间:')).not.toBeInTheDocument()
  })

  it('应该正确显示加载状态', async () => {
    process.env.NODE_ENV = 'development'
    const user = userEvent.setup()

    render(
      <PageLoadingProvider>
        <TestComponent />
        <PerformanceMonitor />
      </PageLoadingProvider>
    )

    const startButton = screen.getByTestId('start-loading')
    
    // 检查初始状态
    expect(screen.getByText('就绪')).toBeInTheDocument()
    expect(screen.getByText('就绪')).toHaveClass('text-green-400')

    // 开始加载
    await act(async () => {
      await user.click(startButton)
    })

    expect(screen.getByText('加载中')).toBeInTheDocument()
    expect(screen.getByText('加载中')).toHaveClass('text-yellow-400')
  })

  it('应该正确显示性能指标', () => {
    process.env.NODE_ENV = 'development'

    render(
      <PageLoadingProvider>
        <PerformanceMonitor />
      </PageLoadingProvider>
    )

    // 验证性能指标显示
    const loadTimeElement = screen.getByText(/加载时间: \d+ms/)
    const renderTimeElement = screen.getByText(/渲染时间: \d+ms/)

    expect(loadTimeElement).toBeInTheDocument()
    expect(renderTimeElement).toBeInTheDocument()
  })
})

describe('性能指标计算', () => {
  it('应该正确计算加载和渲染时间', async () => {
    const user = userEvent.setup()
    let startTime: number
    let endTime: number

    render(
      <PageLoadingProvider>
        <TestComponent />
      </PageLoadingProvider>
    )

    const startButton = screen.getByTestId('start-loading')
    const stopButton = screen.getByTestId('stop-loading')

    // 记录开始时间
    await act(async () => {
      startTime = Date.now()
      await user.click(startButton)
    })

    // 等待一段时间
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // 记录结束时间并停止加载
    await act(async () => {
      endTime = Date.now()
      await user.click(stopButton)
    })

    // 验证时间计算的合理性
    const expectedLoadTime = endTime - startTime
    expect(mockLogger.info).toHaveBeenCalledWith(
      '页面加载完成',
      expect.objectContaining({
        loadTime: expect.any(Number),
        renderTime: expect.any(Number),
      })
    )

    // 获取实际记录的时间
    const logCall = mockLogger.info.mock.calls.find(call => call[0] === '页面加载完成')
    expect(logCall).toBeDefined()
    const { loadTime } = logCall[1]
    
    // 时间应该在合理范围内（考虑测试环境的误差）
    expect(loadTime).toBeGreaterThanOrEqual(90) // 至少90ms
    expect(loadTime).toBeLessThan(expectedLoadTime + 50) // 不超过预期时间+50ms误差
  })
})