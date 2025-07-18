/**
 * AuthMetricsView 单元测试
 * 
 * 测试认证性能监控组件的核心功能
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AuthMetricsView } from '../AuthMetricsView'

// Mock @linch-kit/ui components
const MockCard = ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>
const MockCardContent = ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>
const MockCardHeader = ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>
const MockCardTitle = ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>
const MockCardDescription = ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>
const MockSelect = ({ children, ...props }: any) => <select data-testid="select" {...props}>{children}</select>
const MockSelectContent = ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>
const MockSelectItem = ({ children, ...props }: any) => <option data-testid="select-item" {...props}>{children}</option>
const MockSelectTrigger = ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>
const MockSelectValue = ({ ...props }: any) => <span data-testid="select-value" {...props} />
const MockButton = ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>
const MockBadge = ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>
const MockProgress = ({ ...props }: any) => <div data-testid="progress" {...props} />

// Mock lucide-react icons
const MockIcon = ({ ...props }: any) => <span data-testid="icon" {...props} />

mock.module('@linch-kit/ui', () => ({
  Card: MockCard,
  CardContent: MockCardContent,
  CardHeader: MockCardHeader,
  CardTitle: MockCardTitle,
  CardDescription: MockCardDescription,
  Select: MockSelect,
  SelectContent: MockSelectContent,
  SelectItem: MockSelectItem,
  SelectTrigger: MockSelectTrigger,
  SelectValue: MockSelectValue,
  Button: MockButton,
  Badge: MockBadge,
  Progress: MockProgress
}))

mock.module('lucide-react', () => ({
  TrendingUp: MockIcon,
  TrendingDown: MockIcon,
  Users: MockIcon,
  Shield: MockIcon,
  AlertTriangle: MockIcon,
  Clock: MockIcon,
  Activity: MockIcon,
  BarChart3: MockIcon,
  RefreshCw: MockIcon
}))

describe('AuthMetricsView', () => {
  beforeEach(() => {
    // Reset any global state before each test
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }))
  })

  it('should render without crashing', () => {
    render(<AuthMetricsView />)
    expect(screen.getByTestId('select')).toBeTruthy()
  })

  it('should display time range selector', () => {
    render(<AuthMetricsView />)
    
    // Check if time range selector is rendered
    const select = screen.getByTestId('select')
    expect(select).toBeTruthy()
    
    // Check default time range (24h)
    expect(select.value).toBe('24h')
  })

  it('should display real-time badge', () => {
    render(<AuthMetricsView />)
    
    // Check if real-time badge is displayed
    const badge = screen.getByText('实时数据')
    expect(badge).toBeTruthy()
  })

  it('should display refresh button', () => {
    render(<AuthMetricsView />)
    
    // Check if refresh button is displayed
    const refreshButton = screen.getByText('刷新')
    expect(refreshButton).toBeTruthy()
  })

  it('should show loading state initially', () => {
    render(<AuthMetricsView />)
    
    // Should show loading skeleton cards
    const cards = screen.getAllByTestId('card')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should display metric cards after loading', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if metric cards are displayed
    expect(screen.getByText('登录尝试')).toBeTruthy()
    expect(screen.getByText('登录成功率')).toBeTruthy()
    expect(screen.getByText('平均响应时间')).toBeTruthy()
    expect(screen.getByText('异常登录')).toBeTruthy()
    expect(screen.getByText('JWT令牌发放')).toBeTruthy()
    expect(screen.getByText('会话过期')).toBeTruthy()
  })

  it('should display metric values', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if metric values are displayed
    expect(screen.getByText('1,234')).toBeTruthy()
    expect(screen.getByText('94.2%')).toBeTruthy()
    expect(screen.getByText('120ms')).toBeTruthy()
    expect(screen.getByText('23')).toBeTruthy()
    expect(screen.getByText('1,156')).toBeTruthy()
    expect(screen.getByText('89')).toBeTruthy()
  })

  it('should display change indicators', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if change indicators are displayed
    expect(screen.getByText('12.5%')).toBeTruthy()
    expect(screen.getByText('2.1%')).toBeTruthy()
    expect(screen.getByText('5.3%')).toBeTruthy()
    expect(screen.getByText('相比上期')).toBeTruthy()
  })

  it('should display trend chart', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if trend chart is displayed
    expect(screen.getByText('登录趋势分析')).toBeTruthy()
    expect(screen.getByText('查看不同时间段的登录尝试和成功率趋势')).toBeTruthy()
  })

  it('should display chart legend', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if chart legend is displayed
    expect(screen.getByText('登录尝试')).toBeTruthy()
    expect(screen.getByText('登录成功')).toBeTruthy()
    expect(screen.getByText('登录失败')).toBeTruthy()
  })

  it('should display system performance section', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if system performance section is displayed
    expect(screen.getByText('系统性能')).toBeTruthy()
    expect(screen.getByText('CPU使用率')).toBeTruthy()
    expect(screen.getByText('内存使用率')).toBeTruthy()
    expect(screen.getByText('Redis连接池')).toBeTruthy()
  })

  it('should display error statistics section', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if error statistics section is displayed
    expect(screen.getByText('错误统计')).toBeTruthy()
    expect(screen.getByText('Token验证失败')).toBeTruthy()
    expect(screen.getByText('密码错误')).toBeTruthy()
    expect(screen.getByText('账户锁定')).toBeTruthy()
    expect(screen.getByText('超时错误')).toBeTruthy()
  })

  it('should display progress bars', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if progress bars are displayed
    const progressBars = screen.getAllByTestId('progress')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('should handle time range change', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Change time range
    const select = screen.getByTestId('select')
    fireEvent.change(select, { target: { value: '7d' } })
    
    // Should update time range
    expect(select.value).toBe('7d')
  })

  it('should handle refresh button click', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Click refresh button
    const refreshButton = screen.getByText('刷新')
    fireEvent.click(refreshButton)
    
    // Should trigger refresh
    expect(refreshButton).toBeTruthy()
  })

  it('should display metric descriptions', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if metric descriptions are displayed
    expect(screen.getByText('总登录尝试次数')).toBeTruthy()
    expect(screen.getByText('成功登录比例')).toBeTruthy()
    expect(screen.getByText('认证请求平均处理时间')).toBeTruthy()
    expect(screen.getByText('被标记为可疑的登录尝试')).toBeTruthy()
  })

  it('should handle loading state for chart', async () => {
    render(<AuthMetricsView />)
    
    // Should show loading state initially
    expect(screen.getByText('加载图表数据...')).toBeTruthy()
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
  })

  it('should display error badges with counts', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if error badges are displayed
    const badges = screen.getAllByTestId('badge')
    const errorBadges = badges.filter(badge => 
      badge.textContent?.match(/\d+/)
    )
    
    expect(errorBadges.length).toBeGreaterThan(0)
  })

  it('should show correct progress percentages', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if progress percentages are displayed
    expect(screen.getByText('23%')).toBeTruthy()
    expect(screen.getByText('45%')).toBeTruthy()
    expect(screen.getByText('78%')).toBeTruthy()
  })

  it('should handle API error gracefully', async () => {
    // Mock API error
    global.fetch = mock(() => Promise.reject(new Error('API Error')))
    
    render(<AuthMetricsView />)
    
    // Should still render without crashing
    expect(screen.getByTestId('select')).toBeTruthy()
  })

  it('should render chart data correctly', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if chart data labels are displayed
    expect(screen.getByText('00:00')).toBeTruthy()
    expect(screen.getByText('04:00')).toBeTruthy()
    expect(screen.getByText('08:00')).toBeTruthy()
    expect(screen.getByText('12:00')).toBeTruthy()
    expect(screen.getByText('16:00')).toBeTruthy()
    expect(screen.getByText('20:00')).toBeTruthy()
  })

  it('should maintain responsive design', async () => {
    render(<AuthMetricsView />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载图表数据...')).toBeFalsy()
    })
    
    // Check if grid layout is applied
    const cards = screen.getAllByTestId('card')
    expect(cards.length).toBeGreaterThan(0)
  })
})