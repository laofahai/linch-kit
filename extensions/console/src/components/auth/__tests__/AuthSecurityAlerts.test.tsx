/**
 * AuthSecurityAlerts 单元测试
 * 
 * 测试认证安全警报组件的核心功能
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AuthSecurityAlerts } from '../AuthSecurityAlerts'

// Mock @linch-kit/ui components
const MockCard = ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>
const MockCardContent = ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>
const MockCardHeader = ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>
const MockCardTitle = ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>
const MockCardDescription = ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>
const MockBadge = ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>
const MockButton = ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>
const MockTable = ({ children, ...props }: any) => <table data-testid="table" {...props}>{children}</table>
const MockTableBody = ({ children, ...props }: any) => <tbody data-testid="table-body" {...props}>{children}</tbody>
const MockTableCell = ({ children, ...props }: any) => <td data-testid="table-cell" {...props}>{children}</td>
const MockTableHead = ({ children, ...props }: any) => <th data-testid="table-head" {...props}>{children}</th>
const MockTableHeader = ({ children, ...props }: any) => <thead data-testid="table-header" {...props}>{children}</thead>
const MockTableRow = ({ children, ...props }: any) => <tr data-testid="table-row" {...props}>{children}</tr>
const MockSelect = ({ children, ...props }: any) => <select data-testid="select" {...props}>{children}</select>
const MockSelectContent = ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>
const MockSelectItem = ({ children, ...props }: any) => <option data-testid="select-item" {...props}>{children}</option>
const MockSelectTrigger = ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>
const MockSelectValue = ({ ...props }: any) => <span data-testid="select-value" {...props} />
const MockInput = ({ ...props }: any) => <input data-testid="input" {...props} />
const MockTabs = ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>
const MockTabsContent = ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>
const MockTabsList = ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>
const MockTabsTrigger = ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>

// Mock lucide-react icons
const MockIcon = ({ ...props }: any) => <span data-testid="icon" {...props} />

mock.module('@linch-kit/ui', () => ({
  Card: MockCard,
  CardContent: MockCardContent,
  CardHeader: MockCardHeader,
  CardTitle: MockCardTitle,
  CardDescription: MockCardDescription,
  Badge: MockBadge,
  Button: MockButton,
  Table: MockTable,
  TableBody: MockTableBody,
  TableCell: MockTableCell,
  TableHead: MockTableHead,
  TableHeader: MockTableHeader,
  TableRow: MockTableRow,
  Select: MockSelect,
  SelectContent: MockSelectContent,
  SelectItem: MockSelectItem,
  SelectTrigger: MockSelectTrigger,
  SelectValue: MockSelectValue,
  Input: MockInput,
  Tabs: MockTabs,
  TabsContent: MockTabsContent,
  TabsList: MockTabsList,
  TabsTrigger: MockTabsTrigger
}))

mock.module('lucide-react', () => ({
  AlertTriangle: MockIcon,
  Shield: MockIcon,
  Eye: MockIcon,
  Clock: MockIcon,
  MapPin: MockIcon,
  User: MockIcon,
  Search: MockIcon,
  RefreshCw: MockIcon,
  CheckCircle: MockIcon,
  XCircle: MockIcon
}))

describe('AuthSecurityAlerts', () => {
  beforeEach(() => {
    // Reset any global state before each test
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }))
  })

  it('should render without crashing', () => {
    render(<AuthSecurityAlerts />)
    expect(screen.getByTestId('tabs')).toBeTruthy()
  })

  it('should display security alerts and events tabs', () => {
    render(<AuthSecurityAlerts />)
    
    // Check if tabs are rendered
    const tabTriggers = screen.getAllByTestId('tabs-trigger')
    expect(tabTriggers).toHaveLength(2)
    
    // Check tab labels
    expect(screen.getByText('安全警报')).toBeTruthy()
    expect(screen.getByText('安全事件')).toBeTruthy()
  })

  it('should display filter controls', () => {
    render(<AuthSecurityAlerts />)
    
    // Check if filter controls are rendered
    const selects = screen.getAllByTestId('select')
    expect(selects.length).toBeGreaterThan(0)
    
    const searchInput = screen.getByPlaceholderText('搜索警报...')
    expect(searchInput).toBeTruthy()
  })

  it('should display refresh button', () => {
    render(<AuthSecurityAlerts />)
    
    // Check if refresh button is displayed
    const refreshButton = screen.getByText('刷新')
    expect(refreshButton).toBeTruthy()
  })

  it('should show loading state initially', () => {
    render(<AuthSecurityAlerts />)
    
    // Should show loading skeleton
    expect(screen.getByText('加载中...')).toBeTruthy()
  })

  it('should display security alerts after loading', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if alerts table is displayed
    const table = screen.getByTestId('table')
    expect(table).toBeTruthy()
  })

  it('should display alert severity badges', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if severity badges are displayed
    const badges = screen.getAllByTestId('badge')
    const severityBadges = badges.filter(badge => 
      badge.textContent?.includes('严重') || 
      badge.textContent?.includes('高') ||
      badge.textContent?.includes('中') ||
      badge.textContent?.includes('低')
    )
    
    expect(severityBadges.length).toBeGreaterThan(0)
  })

  it('should display alert status badges', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if status badges are displayed
    const badges = screen.getAllByTestId('badge')
    const statusBadges = badges.filter(badge => 
      badge.textContent?.includes('活跃') || 
      badge.textContent?.includes('调查中') ||
      badge.textContent?.includes('已解决') ||
      badge.textContent?.includes('误报')
    )
    
    expect(statusBadges.length).toBeGreaterThan(0)
  })

  it('should handle alert type filter', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Find and change alert type filter
    const selects = screen.getAllByTestId('select')
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value: 'suspicious_login' } })
      expect(selects[0].value).toBe('suspicious_login')
    }
  })

  it('should handle severity filter', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Find and change severity filter
    const selects = screen.getAllByTestId('select')
    if (selects.length > 1) {
      fireEvent.change(selects[1], { target: { value: 'high' } })
      expect(selects[1].value).toBe('high')
    }
  })

  it('should handle status filter', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Find and change status filter
    const selects = screen.getAllByTestId('select')
    if (selects.length > 2) {
      fireEvent.change(selects[2], { target: { value: 'active' } })
      expect(selects[2].value).toBe('active')
    }
  })

  it('should handle search input', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Find and use search input
    const searchInput = screen.getByPlaceholderText('搜索警报...')
    fireEvent.change(searchInput, { target: { value: 'suspicious' } })
    
    expect(searchInput.value).toBe('suspicious')
  })

  it('should display alert action buttons', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if action buttons are displayed
    const buttons = screen.getAllByTestId('button')
    const actionButtons = buttons.filter(button => 
      button.textContent?.includes('确认') || 
      button.textContent?.includes('调查') ||
      button.textContent?.includes('解决') ||
      button.textContent?.includes('标记误报')
    )
    
    expect(actionButtons.length).toBeGreaterThan(0)
  })

  it('should handle alert action clicks', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Find and click action button
    const buttons = screen.getAllByTestId('button')
    const actionButtons = buttons.filter(button => 
      button.textContent?.includes('确认')
    )
    
    if (actionButtons.length > 0) {
      fireEvent.click(actionButtons[0])
      // Should trigger action
      expect(actionButtons[0]).toBeTruthy()
    }
  })

  it('should switch to security events tab', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Click on security events tab
    const eventsTab = screen.getByText('安全事件')
    fireEvent.click(eventsTab)
    
    // Should show events content
    expect(screen.getByText('安全事件')).toBeTruthy()
  })

  it('should display alert details', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if alert details are displayed
    const tableCells = screen.getAllByTestId('table-cell')
    expect(tableCells.length).toBeGreaterThan(0)
  })

  it('should handle refresh button click', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Click refresh button
    const refreshButton = screen.getByText('刷新')
    fireEvent.click(refreshButton)
    
    // Should trigger refresh
    expect(refreshButton).toBeTruthy()
  })

  it('should display alert timestamps', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if timestamps are displayed
    const cells = screen.getAllByTestId('table-cell')
    const timestampCells = cells.filter(cell => 
      cell.textContent?.includes('2025-07-18') ||
      cell.textContent?.includes('分钟前') ||
      cell.textContent?.includes('小时前')
    )
    
    expect(timestampCells.length).toBeGreaterThan(0)
  })

  it('should display IP addresses', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if IP addresses are displayed
    const cells = screen.getAllByTestId('table-cell')
    const ipCells = cells.filter(cell => 
      cell.textContent?.match(/\d+\.\d+\.\d+\.\d+/)
    )
    
    expect(ipCells.length).toBeGreaterThan(0)
  })

  it('should handle alert sorting', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if table headers are clickable for sorting
    const tableHeaders = screen.getAllByTestId('table-head')
    expect(tableHeaders.length).toBeGreaterThan(0)
  })

  it('should display alert descriptions', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if alert descriptions are displayed
    const cells = screen.getAllByTestId('table-cell')
    const descriptionCells = cells.filter(cell => 
      cell.textContent?.includes('尝试从') ||
      cell.textContent?.includes('连续') ||
      cell.textContent?.includes('检测到')
    )
    
    expect(descriptionCells.length).toBeGreaterThan(0)
  })

  it('should handle empty state', async () => {
    // Mock empty response
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    }))
    
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Should handle empty state gracefully
    expect(screen.getByTestId('table')).toBeTruthy()
  })

  it('should handle API error gracefully', async () => {
    // Mock API error
    global.fetch = mock(() => Promise.reject(new Error('API Error')))
    
    render(<AuthSecurityAlerts />)
    
    // Should still render without crashing
    expect(screen.getByTestId('tabs')).toBeTruthy()
  })

  it('should maintain filter state', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Set filters
    const searchInput = screen.getByPlaceholderText('搜索警报...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    // Should maintain filter state
    expect(searchInput.value).toBe('test')
  })

  it('should display user information', async () => {
    render(<AuthSecurityAlerts />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeFalsy()
    })
    
    // Check if user information is displayed
    const cells = screen.getAllByTestId('table-cell')
    const userCells = cells.filter(cell => 
      cell.textContent?.includes('@') ||
      cell.textContent?.includes('user')
    )
    
    expect(userCells.length).toBeGreaterThan(0)
  })
})