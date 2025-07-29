/**
 * 认证会话管理组件
 * 
 * 提供用户会话的查看、管理和监控功能
 */

import { useState, useEffect } from 'react'
import { 
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@linch-kit/ui/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@linch-kit/ui/server'
import { 
  User, 
  Clock, 
  MapPin, 
  AlertTriangle,
  LogOut,
  Search,
  RefreshCw,
  Eye
} from 'lucide-react'
import { consoleAuthApiClient } from '../../api/auth-api'

interface AuthSession {
  id: string
  userId: string
  isActive: boolean
  createdAt: string
  expiresAt: string
  deviceInfo?: string
  userEmail?: string
  userName?: string
  status: 'active' | 'expired' | 'revoked' | 'inactive'
}

interface AuthSessionManagerProps {
  className?: string
}

/**
 * 认证会话管理组件
 */
export function AuthSessionManager({ className }: AuthSessionManagerProps) {
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [_revokeDialog, _setRevokeDialog] = useState<{
    open: boolean
    session: AuthSession | null
  }>({
    open: false,
    session: null
  })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      // 使用真实的API调用获取会话数据
      const response = await consoleAuthApiClient.getSessions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      })
      
      const formattedSessions: AuthSession[] = response.sessions.map(session => ({
        ...session,
        status: session.isActive ? 'active' : 'inactive'
      }))
      
      setSessions(formattedSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      // 如果API调用失败，显示空数组而不是模拟数据
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.deviceInfo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // 使用真实的API调用撤销会话
      await consoleAuthApiClient.revokeSession(sessionId)
      
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'revoked' as const }
          : session
      ))
      
      _setRevokeDialog({ open: false, session: null })
    } catch (error) {
      console.error('Failed to revoke session:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary">活跃</Badge>
      case 'expired':
        return <Badge variant="secondary">已过期</Badge>
      case 'revoked':
        return <Badge variant="destructive">已撤销</Badge>
      case 'inactive':
        return <Badge variant="secondary">未活跃</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="secondary" className="text-xs">低风险</Badge>
      case 'medium':
        return <Badge variant="secondary" className="text-xs">中风险</Badge>
      case 'high':
        return <Badge variant="destructive" className="text-xs">高风险</Badge>
      default:
        return null
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '刚才'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}小时前`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}天前`
  }

  return (
    <div className={className}>
      {/* 搜索和过滤 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户邮箱或设备信息..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
            <SelectItem value="revoked">已撤销</SelectItem>
            <SelectItem value="inactive">未活跃</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm" onClick={loadSessions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 会话表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>会话状态</TableHead>
              <TableHead>设备信息</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无会话数据
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.userAvatar} />
                        <AvatarFallback>
                          {session.userEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{session.userEmail}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.userRole}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      {session.securityFlags?.isSuspicious && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>可疑活动</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {session.deviceInfo?.browser} on {session.deviceInfo?.platform}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {session.deviceInfo?.location}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(session.lastAccessAt)}
                      </div>
                      <div className="text-muted-foreground">
                        过期: {formatTimeAgo(session.expiresAt)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getRiskBadge(session.securityFlags?.riskLevel)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {session.status === 'active' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>撤销会话</DialogTitle>
                              <DialogDescription>
                                确定要撤销用户 {session.userEmail} 的会话吗？
                                用户将被强制退出登录。
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">取消</Button>
                              <Button
                                onClick={() => handleRevokeSession(session.id)}
                                variant="destructive"
                              >
                                确认撤销
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 统计信息 */}
      <div className="mt-4 text-sm text-muted-foreground">
        显示 {filteredSessions.length} 条会话，共 {sessions.length} 条
      </div>
    </div>
  )
}

export default AuthSessionManager