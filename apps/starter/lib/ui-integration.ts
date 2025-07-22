/**
 * UI包集成工具库
 * 集成 @linch-kit/ui 的所有组件和功能
 */

// 客户端组件
// Mobile hook - create custom implementation
import { useState, useEffect } from 'react'

export {
  Button,
  Input,
  Select,
  Textarea,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  Toast,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ThemeToggle,
  LoadingOverlay,
  ErrorBoundary,
  ExtensionManager,
  SchemaForm,
  SchemaFieldRenderer,
  SchemaTable,
  DashboardLayoutShell as DashboardLayout,
  Sidebar
} from '@linch-kit/ui/client'

// 服务端组件
export {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Progress,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@linch-kit/ui/server'

// Hooks
export {
  useTheme
} from '@linch-kit/ui/client'

export {
  useToast
} from '@linch-kit/ui'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)

    return () => { window.removeEventListener('resize', checkDevice); }
  }, [])

  return isMobile
}

// 工具类
export { cn } from '@linch-kit/ui/shared'

// 主题系统已内置到UI包中
// 移除不存在的导出

/**
 * UI集成配置
 */
export interface UIIntegrationConfig {
  theme: {
    defaultTheme: 'light' | 'dark' | 'system'
    enableStorageSync: boolean
    storageKey: string
  }
  forms: {
    enableValidation: boolean
    defaultValidationMode: 'onSubmit' | 'onBlur' | 'onChange'
  }
  components: {
    defaultVariants: Record<string, string>
    enableAnimations: boolean
  }
  accessibility: {
    enableScreenReaderSupport: boolean
    enableKeyboardNavigation: boolean
  }
}

/**
 * 默认UI集成配置
 */
export const defaultUIConfig: UIIntegrationConfig = {
  theme: {
    defaultTheme: 'system',
    enableStorageSync: true,
    storageKey: 'linchkit-theme'
  },
  forms: {
    enableValidation: true,
    defaultValidationMode: 'onSubmit'
  },
  components: {
    defaultVariants: {
      button: 'default',
      input: 'default',
      card: 'default'
    },
    enableAnimations: true
  },
  accessibility: {
    enableScreenReaderSupport: true,
    enableKeyboardNavigation: true
  }
}

/**
 * UI集成工具类
 */
export class UIIntegration {
  private config: UIIntegrationConfig

  constructor(config: Partial<UIIntegrationConfig> = {}) {
    this.config = { ...defaultUIConfig, ...config }
  }

  /**
   * 获取主题配置
   */
  getThemeConfig() {
    return {
      attribute: 'class',
      defaultTheme: this.config.theme.defaultTheme,
      enableSystem: true,
      disableTransitionOnChange: false,
      storageKey: this.config.theme.storageKey
    }
  }

  /**
   * 获取表单配置
   */
  getFormConfig() {
    return {
      mode: this.config.forms.defaultValidationMode,
      reValidateMode: 'onChange',
      shouldFocusError: true,
      shouldUnregister: false
    }
  }

  /**
   * 获取组件默认属性
   */
  getComponentProps(componentName: string) {
    const defaultVariant = this.config.components.defaultVariants[componentName]
    return defaultVariant ? { variant: defaultVariant } : {}
  }

  /**
   * 检查是否启用动画
   */
  isAnimationEnabled() {
    return this.config.components.enableAnimations
  }

  /**
   * 检查是否启用无障碍支持
   */
  isAccessibilityEnabled() {
    return this.config.accessibility.enableScreenReaderSupport
  }

  /**
   * 获取完整配置
   */
  getConfig() {
    return this.config
  }
}

/**
 * 默认UI集成实例
 */
export const uiIntegration = new UIIntegration()

/**
 * 创建自定义UI集成实例
 */
export function createUIIntegration(config: Partial<UIIntegrationConfig>) {
  return new UIIntegration(config)
}

/**
 * UI组件预设
 */
export const UIPresets = {
  // 按钮预设
  buttons: {
    primary: { variant: 'default', size: 'default' },
    secondary: { variant: 'secondary', size: 'default' },
    outline: { variant: 'outline', size: 'default' },
    ghost: { variant: 'ghost', size: 'default' },
    destructive: { variant: 'destructive', size: 'default' }
  },
  
  // 卡片预设
  cards: {
    default: { className: 'w-full' },
    compact: { className: 'w-full p-4' },
    elevated: { className: 'w-full shadow-lg' }
  },
  
  // 表单预设
  forms: {
    default: { className: 'space-y-4' },
    compact: { className: 'space-y-2' },
    wide: { className: 'space-y-6 max-w-2xl' }
  }
}

/**
 * 响应式工具
 */
export const ResponsiveUtils = {
  // 断点检查
  breakpoints: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)'
  },
  
  // 容器类名
  containers: {
    sm: 'container mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8'
  }
}

/**
 * 颜色主题工具
 */
export const ColorUtils = {
  // 状态颜色
  status: {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400'
  },
  
  // 背景颜色
  backgrounds: {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    muted: 'bg-muted text-muted-foreground',
    card: 'bg-card text-card-foreground'
  }
}