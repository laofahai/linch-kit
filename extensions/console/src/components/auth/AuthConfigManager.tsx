/**
 * 认证配置管理组件
 * 
 * 提供JWT、会话、OAuth等认证配置的管理界面
 */

import { useState, useEffect } from 'react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Switch,
  Textarea,
  Alert,
  AlertDescription,
  Badge
} from '@linch-kit/ui'
import { 
  Key,
  Clock,
  Shield,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'

interface ConfigItem {
  key: string
  value: unknown
  category: string
  description: string
  isSecret: boolean
  isRequired: boolean
  type: 'string' | 'number' | 'boolean' | 'json'
}

interface AuthConfigManagerProps {
  className?: string
}

/**
 * 认证配置管理组件
 */
export function AuthConfigManager({ className }: AuthConfigManagerProps) {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('jwt')

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockConfigs: ConfigItem[] = [
        // JWT配置
        {
          key: 'jwt_secret',
          value: 'super-secret-key-123',
          category: 'jwt',
          description: 'JWT签名密钥',
          isSecret: true,
          isRequired: true,
          type: 'string'
        },
        {
          key: 'jwt_expires_in',
          value: '24h',
          category: 'jwt',
          description: 'JWT过期时间',
          isSecret: false,
          isRequired: true,
          type: 'string'
        },
        {
          key: 'jwt_refresh_expires_in',
          value: '7d',
          category: 'jwt',
          description: '刷新令牌过期时间',
          isSecret: false,
          isRequired: true,
          type: 'string'
        },
        {
          key: 'jwt_issuer',
          value: 'linchkit-auth',
          category: 'jwt',
          description: 'JWT发行者',
          isSecret: false,
          isRequired: true,
          type: 'string'
        },
        
        // 会话配置
        {
          key: 'session_max_age',
          value: 86400,
          category: 'session',
          description: '会话最大存活时间（秒）',
          isSecret: false,
          isRequired: true,
          type: 'number'
        },
        {
          key: 'session_secure',
          value: true,
          category: 'session',
          description: '是否启用安全会话',
          isSecret: false,
          isRequired: true,
          type: 'boolean'
        },
        {
          key: 'session_same_site',
          value: 'strict',
          category: 'session',
          description: 'SameSite策略',
          isSecret: false,
          isRequired: true,
          type: 'string'
        },
        
        // 安全配置
        {
          key: 'rate_limit_max_attempts',
          value: 5,
          category: 'security',
          description: '最大登录尝试次数',
          isSecret: false,
          isRequired: true,
          type: 'number'
        },
        {
          key: 'rate_limit_window',
          value: 300,
          category: 'security',
          description: '限制时间窗口（秒）',
          isSecret: false,
          isRequired: true,
          type: 'number'
        },
        {
          key: 'password_min_length',
          value: 8,
          category: 'security',
          description: '密码最小长度',
          isSecret: false,
          isRequired: true,
          type: 'number'
        },
        {
          key: 'mfa_enabled',
          value: true,
          category: 'security',
          description: '是否启用多因素认证',
          isSecret: false,
          isRequired: false,
          type: 'boolean'
        },
        
        // OAuth配置
        {
          key: 'oauth_google_client_id',
          value: 'google-client-id-123',
          category: 'oauth',
          description: 'Google OAuth客户端ID',
          isSecret: false,
          isRequired: false,
          type: 'string'
        },
        {
          key: 'oauth_google_client_secret',
          value: 'google-client-secret-456',
          category: 'oauth',
          description: 'Google OAuth客户端密钥',
          isSecret: true,
          isRequired: false,
          type: 'string'
        },
        {
          key: 'oauth_github_client_id',
          value: 'github-client-id-789',
          category: 'oauth',
          description: 'GitHub OAuth客户端ID',
          isSecret: false,
          isRequired: false,
          type: 'string'
        },
        {
          key: 'oauth_github_client_secret',
          value: 'github-client-secret-abc',
          category: 'oauth',
          description: 'GitHub OAuth客户端密钥',
          isSecret: true,
          isRequired: false,
          type: 'string'
        }
      ]
      
      setConfigs(mockConfigs)
    } catch (error) {
      console.error('Failed to load configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfigs = async () => {
    setSaving(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setHasChanges(false)
      
      // 这里会发送实际的配置更新请求
      console.log('Saving configs:', configs)
    } catch (error) {
      console.error('Failed to save configs:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: string, value: unknown) => {
    setConfigs(prev => prev.map(config => 
      config.key === key ? { ...config, value } : config
    ))
    setHasChanges(true)
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filterConfigsByCategory = (category: string) => {
    return configs.filter(config => config.category === category)
  }

  const renderConfigInput = (config: ConfigItem) => {
    const isSecretVisible = showSecrets[config.key]
    
    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={config.key}
              checked={config.value as boolean}
              onCheckedChange={(checked) => updateConfig(config.key, checked)}
            />
            <Label htmlFor={config.key} className="text-sm">
              {config.value ? '启用' : '禁用'}
            </Label>
          </div>
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={config.value as number}
            onChange={(e) => updateConfig(config.key, Number(e.target.value))}
            className="w-full"
          />
        )
      
      case 'json':
        return (
          <Textarea
            value={JSON.stringify(config.value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                updateConfig(config.key, parsed)
              } catch {
                // 忽略JSON解析错误
              }
            }}
            className="w-full min-h-[100px] font-mono text-sm"
          />
        )
      
      default:
        return (
          <div className="relative">
            <Input
              type={config.isSecret && !isSecretVisible ? 'password' : 'text'}
              value={config.value as string}
              onChange={(e) => updateConfig(config.key, e.target.value)}
              className="w-full pr-10"
            />
            {config.isSecret && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility(config.key)}
              >
                {isSecretVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )
    }
  }

  const renderConfigCard = (config: ConfigItem) => (
    <Card key={config.key} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {config.key}
          </CardTitle>
          <div className="flex items-center gap-2">
            {config.isRequired && (
              <Badge variant="destructive" className="text-xs">
                必需
              </Badge>
            )}
            {config.isSecret && (
              <Badge variant="warning" className="text-xs">
                敏感
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor={config.key} className="text-sm font-medium">
            值
          </Label>
          {renderConfigInput(config)}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="warning" className="text-xs">
              有未保存的更改
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadConfigs} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          
          <Button 
            onClick={saveConfigs} 
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 配置选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="jwt" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            JWT
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            会话
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            安全
          </TabsTrigger>
          <TabsTrigger value="oauth" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            OAuth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jwt" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">JWT配置</h3>
            <p className="text-sm text-muted-foreground">
              管理JWT令牌的生成、验证和过期设置
            </p>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            filterConfigsByCategory('jwt').map(renderConfigCard)
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">会话配置</h3>
            <p className="text-sm text-muted-foreground">
              管理用户会话的生命周期和安全设置
            </p>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            filterConfigsByCategory('session').map(renderConfigCard)
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">安全配置</h3>
            <p className="text-sm text-muted-foreground">
              配置认证安全策略、密码策略和多因素认证
            </p>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            filterConfigsByCategory('security').map(renderConfigCard)
          )}
        </TabsContent>

        <TabsContent value="oauth" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">OAuth配置</h3>
            <p className="text-sm text-muted-foreground">
              配置第三方登录提供商的OAuth设置
            </p>
          </div>
          
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              OAuth配置更改需要重启应用程序才能生效
            </AlertDescription>
          </Alert>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            filterConfigsByCategory('oauth').map(renderConfigCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuthConfigManager