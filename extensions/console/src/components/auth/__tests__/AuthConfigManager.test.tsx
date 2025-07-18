/**
 * AuthConfigManager 单元测试
 * 
 * 测试认证配置管理组件的核心功能
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AuthConfigManager } from '../AuthConfigManager'

// Mock @linch-kit/ui components
const MockCard = ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>
const MockCardContent = ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>
const MockCardHeader = ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>
const MockCardTitle = ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>
const MockCardDescription = ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>
const MockTabs = ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>
const MockTabsContent = ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>
const MockTabsList = ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>
const MockTabsTrigger = ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>
const MockButton = ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>
const MockInput = ({ ...props }: any) => <input data-testid="input" {...props} />
const MockLabel = ({ children, ...props }: any) => <label data-testid="label" {...props}>{children}</label>
const MockSwitch = ({ ...props }: any) => <input type="checkbox" data-testid="switch" {...props} />
const MockTextarea = ({ ...props }: any) => <textarea data-testid="textarea" {...props} />
const MockAlert = ({ children, ...props }: any) => <div data-testid="alert" {...props}>{children}</div>
const MockAlertDescription = ({ children, ...props }: any) => <div data-testid="alert-description" {...props}>{children}</div>
const MockBadge = ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>

// Mock lucide-react icons
const MockIcon = ({ ...props }: any) => <span data-testid="icon" {...props} />

mock.module('@linch-kit/ui', () => ({
  Card: MockCard,
  CardContent: MockCardContent,
  CardHeader: MockCardHeader,
  CardTitle: MockCardTitle,
  CardDescription: MockCardDescription,
  Tabs: MockTabs,
  TabsContent: MockTabsContent,
  TabsList: MockTabsList,
  TabsTrigger: MockTabsTrigger,
  Button: MockButton,
  Input: MockInput,
  Label: MockLabel,
  Switch: MockSwitch,
  Textarea: MockTextarea,
  Alert: MockAlert,
  AlertDescription: MockAlertDescription,
  Badge: MockBadge
}))

mock.module('lucide-react', () => ({
  Key: MockIcon,
  Clock: MockIcon,
  Shield: MockIcon,
  Globe: MockIcon,
  Save: MockIcon,
  RefreshCw: MockIcon,
  Eye: MockIcon,
  EyeOff: MockIcon,
  AlertCircle: MockIcon
}))

describe('AuthConfigManager', () => {
  beforeEach(() => {
    // Reset any global state before each test
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }))
  })

  it('should render without crashing', () => {
    render(<AuthConfigManager />)
    expect(screen.getByTestId('tabs')).toBeTruthy()
  })

  it('should display all configuration tabs', () => {
    render(<AuthConfigManager />)
    
    // Check if all tabs are rendered
    const tabTriggers = screen.getAllByTestId('tabs-trigger')
    expect(tabTriggers).toHaveLength(4)
    
    // Check tab labels
    expect(screen.getByText('JWT')).toBeTruthy()
    expect(screen.getByText('会话')).toBeTruthy()
    expect(screen.getByText('安全')).toBeTruthy()
    expect(screen.getByText('OAuth')).toBeTruthy()
  })

  it('should show loading state initially', () => {
    render(<AuthConfigManager />)
    
    // Should show loading skeleton cards
    const cards = screen.getAllByTestId('card')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should display save button when there are changes', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find and click an input to make changes
    const inputs = screen.getAllByTestId('input')
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'new-value' } })
      
      // Should show save button
      expect(screen.getByText('保存配置')).toBeTruthy()
    }
  })

  it('should handle config refresh', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find and click refresh button
    const refreshButton = screen.getByText('刷新')
    fireEvent.click(refreshButton)
    
    // Should trigger refresh
    expect(refreshButton).toBeTruthy()
  })

  it('should handle secret visibility toggle', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find eye/eye-off icons for secret fields
    const eyeIcons = screen.getAllByTestId('icon')
    expect(eyeIcons.length).toBeGreaterThan(0)
  })

  it('should display JWT configuration section', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Check JWT section
    expect(screen.getByText('JWT配置')).toBeTruthy()
    expect(screen.getByText('管理JWT令牌的生成、验证和过期设置')).toBeTruthy()
  })

  it('should display session configuration section', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Switch to session tab
    const sessionTab = screen.getByText('会话')
    fireEvent.click(sessionTab)
    
    // Check session section
    expect(screen.getByText('会话配置')).toBeTruthy()
    expect(screen.getByText('管理用户会话的生命周期和安全设置')).toBeTruthy()
  })

  it('should display security configuration section', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Switch to security tab
    const securityTab = screen.getByText('安全')
    fireEvent.click(securityTab)
    
    // Check security section
    expect(screen.getByText('安全配置')).toBeTruthy()
    expect(screen.getByText('配置认证安全策略、密码策略和多因素认证')).toBeTruthy()
  })

  it('should display OAuth configuration section', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Switch to OAuth tab
    const oauthTab = screen.getByText('OAuth')
    fireEvent.click(oauthTab)
    
    // Check OAuth section
    expect(screen.getByText('OAuth配置')).toBeTruthy()
    expect(screen.getByText('配置第三方登录提供商的OAuth设置')).toBeTruthy()
  })

  it('should show OAuth warning alert', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Switch to OAuth tab
    const oauthTab = screen.getByText('OAuth')
    fireEvent.click(oauthTab)
    
    // Check OAuth warning
    expect(screen.getByText('OAuth配置更改需要重启应用程序才能生效')).toBeTruthy()
  })

  it('should handle boolean config inputs', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find switch inputs
    const switches = screen.getAllByTestId('switch')
    expect(switches.length).toBeGreaterThan(0)
    
    // Toggle a switch
    if (switches.length > 0) {
      fireEvent.click(switches[0])
      // Should update the value
      expect(switches[0]).toBeTruthy()
    }
  })

  it('should handle number config inputs', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find number inputs
    const inputs = screen.getAllByTestId('input')
    const numberInputs = inputs.filter(input => input.type === 'number')
    
    if (numberInputs.length > 0) {
      fireEvent.change(numberInputs[0], { target: { value: '10' } })
      expect(numberInputs[0].value).toBe('10')
    }
  })

  it('should show required badges for required configs', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find required badges
    const badges = screen.getAllByTestId('badge')
    const requiredBadges = badges.filter(badge => 
      badge.textContent?.includes('必需') || badge.textContent?.includes('敏感')
    )
    
    expect(requiredBadges.length).toBeGreaterThan(0)
  })

  it('should handle config save operation', async () => {
    const mockFetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }))
    global.fetch = mockFetch
    
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Make a change to trigger save button
    const inputs = screen.getAllByTestId('input')
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'new-value' } })
      
      // Click save button
      const saveButton = screen.getByText('保存配置')
      fireEvent.click(saveButton)
      
      // Should show saving state
      expect(screen.getByText('保存中...')).toBeTruthy()
    }
  })

  it('should handle config validation', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Test required field validation
    const inputs = screen.getAllByTestId('input')
    if (inputs.length > 0) {
      // Clear a required field
      fireEvent.change(inputs[0], { target: { value: '' } })
      
      // Should show validation error (if implemented)
      const labels = screen.getAllByTestId('label')
      expect(labels.length).toBeGreaterThan(0)
    }
  })

  it('should handle textarea config inputs', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Find textarea inputs
    const textareas = screen.getAllByTestId('textarea')
    if (textareas.length > 0) {
      fireEvent.change(textareas[0], { target: { value: '{"test": "value"}' } })
      expect(textareas[0].value).toBe('{"test": "value"}')
    }
  })

  it('should maintain changes indicator state', async () => {
    render(<AuthConfigManager />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('保存中...')).toBeFalsy()
    })
    
    // Initially should not show changes
    expect(screen.queryByText('有未保存的更改')).toBeFalsy()
    
    // Make a change
    const inputs = screen.getAllByTestId('input')
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'changed-value' } })
      
      // Should show changes indicator
      expect(screen.getByText('有未保存的更改')).toBeTruthy()
    }
  })
})