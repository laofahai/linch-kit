/**
 * @linch-kit/auth 监控模块入口
 * 
 * 提供认证系统的完整监控解决方案
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

// ==================== 核心监控 ====================
export {
  type AuthOperation,
  type AuthStatus,
  type AuthMetrics,
  type AuthPerformanceStats,
  type IAuthPerformanceMonitor,
  type AuthTimer,
  InMemoryAuthPerformanceMonitor,
  createAuthPerformanceMonitor,
  defaultAuthPerformanceMonitor
} from './auth-metrics'

// ==================== 新版性能监控器 ====================
export {
  type AuthOperation as AuthPerformanceOperation,
  type AuthPerformanceMetric,
  type AuthPerformanceStats as NewAuthPerformanceStats,
  type IAuthPerformanceMonitor as INewAuthPerformanceMonitor,
  type AuthPerformanceTimer,
  AuthPerformanceMonitor,
  createAuthPerformanceMonitor as createNewAuthPerformanceMonitor,
  defaultAuthPerformanceMonitor as defaultNewAuthPerformanceMonitor
} from './auth-performance-monitor'

// ==================== OpenTelemetry集成 ====================
export {
  type OpenTelemetryConfig,
  AUTH_METRICS,
  OpenTelemetryAuthPerformanceMonitor,
  createOpenTelemetryAuthPerformanceMonitor,
  defaultOpenTelemetryConfig
} from './opentelemetry-integration'