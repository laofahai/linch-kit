/**
 * Console 包测试环境设置
 * 修复 React 19 与 @testing-library/react 的兼容性问题
 */

import '@testing-library/jest-dom'

// 修复 React 19 中 ReactSharedInternals 的问题
const React = require('react')

// 为 React 18/19 兼容性提供完整的 polyfill
if (!React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {}
}

const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

// 添加 React 19 需要的所有内部属性
if (!internals.ReactCurrentDispatcher) {
  internals.ReactCurrentDispatcher = { current: null }
}

if (!internals.ReactCurrentBatchConfig) {
  internals.ReactCurrentBatchConfig = { transition: null }
}

if (!internals.ReactCurrentOwner) {
  internals.ReactCurrentOwner = { current: null }
}

if (!internals.ReactDebugCurrentFrame) {
  internals.ReactDebugCurrentFrame = { getCurrentStack: null }
}

// React 19 新增的属性
if (!internals.S) {
  internals.S = { transition: null }
}

if (!internals.ReactCurrentActQueue) {
  internals.ReactCurrentActQueue = { current: null }
}

// 设置 React Testing Library 的兼容性配置
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// 确保全局 React 使用正确的 internals
if (globalThis.React) {
  globalThis.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals
}

// Mock 全局对象
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})

Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock fetch 如果不存在
if (!global.fetch) {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({}),
    text: async () => '',
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  } as Response)
}

// Console 日志清理
const originalError = console.error
console.error = (...args: unknown[]) => {
  // 忽略 React Testing Library 的 act 警告
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactSharedInternals')
  ) {
    return
  }
  originalError.call(console, ...args)
}