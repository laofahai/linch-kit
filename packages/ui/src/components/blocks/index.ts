/**
 * UI Blocks
 * 
 * Pre-built component blocks based on shadcn/ui
 * Ready-to-use page-level components and layouts
 */

// Dashboard Layout
export { DashboardLayout } from "./dashboard-layout"
export type { 
  DashboardLayoutProps, 
  NavigationItem, 
  SidebarConfig, 
  HeaderConfig,
  BreadcrumbItem as DashboardBreadcrumbItem
} from "./dashboard-layout"

// Authentication Forms
export { 
  LoginForm, 
  RegisterForm, 
  PasswordResetForm, 
  UserProfileForm,
  loginSchema,
  registerSchema,
  passwordResetSchema
} from "./auth-forms"
export type { 
  AuthFormProps,
  LoginFormData,
  RegisterFormData,
  PasswordResetFormData
} from "./auth-forms"

// Data Display Blocks
export { 
  StatsCard, 
  ChartContainer, 
  ListLayout, 
  GridLayout, 
  StatsGrid 
} from "./data-display"
export type { 
  StatsCardProps, 
  StatsCardData, 
  ChartContainerProps, 
  LayoutProps 
} from "./data-display"
