/**
 * @linch-kit/auth 认证性能监控 (Edge Runtime 版本)
 *
 * 这是一个用于Edge环境的空实现，以避免导入服务器端依赖。
 */

import type { ILogger } from '../core/core-jwt-auth.service';

import type { AuthOperation, IAuthPerformanceMonitor, AuthPerformanceTimer } from './auth-performance-monitor';

class NoOpAuthPerformanceTimer implements AuthPerformanceTimer {
  operation: AuthOperation;
  startTime: number;
  metadata?: Record<string, unknown> | undefined;

  constructor(operation: AuthOperation) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  success(): Promise<void> { return Promise.resolve(); }
  failure(): Promise<void> { return Promise.resolve(); }
  error(): Promise<void> { return Promise.resolve(); }
}

class NoOpAuthPerformanceMonitor implements IAuthPerformanceMonitor {
  recordAuthMetric(): Promise<void> { return Promise.resolve(); }
  getAuthPerformanceStats() { return Promise.resolve({} as any); }
  startAuthTimer(operation: AuthOperation): AuthPerformanceTimer {
    return new NoOpAuthPerformanceTimer(operation);
  }
  cleanup(): Promise<void> { return Promise.resolve(); }
  getTopErrors() { return Promise.resolve([]); }
  getSlowOperations() { return Promise.resolve([]); }
}

export function createAuthPerformanceMonitor(logger?: ILogger): IAuthPerformanceMonitor {
  if (logger) {
    logger.info('Using No-Op performance monitor for Edge environment.');
  }
  return new NoOpAuthPerformanceMonitor();
}
