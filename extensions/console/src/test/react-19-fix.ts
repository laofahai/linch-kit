/**
 * React 19 兼容性修复
 * 在任何React DOM代码执行前修复ReactSharedInternals
 */

// 在第一时间修复React内部结构
(() => {
  try {
    // 获取React模块
    const React = require('react')
    
    // 确保存在内部结构
    if (!React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {}
    }
    
    const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    
    // 添加所有可能需要的属性
    const defaultInternals = {
      ReactCurrentDispatcher: { current: null },
      ReactCurrentBatchConfig: { transition: null },
      ReactCurrentOwner: { current: null },
      ReactDebugCurrentFrame: { getCurrentStack: null },
      ReactCurrentActQueue: { current: null },
      ReactCurrentCache: { current: null },
      S: { transition: null }, // React 19 新增，不同于ReactCurrentBatchConfig
    }
    
    // 安全地设置每个属性
    Object.keys(defaultInternals).forEach(key => {
      if (!internals[key]) {
        internals[key] = defaultInternals[key]
      }
    })
    
    // 修改全局对象
    if (typeof globalThis !== 'undefined' && globalThis.React) {
      globalThis.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals
    }
    
    // 修改全局window对象（如果存在）
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).React) {
      ;(window as Record<string, unknown>).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals
    }
    
    console.log('[React19Fix] React internals patched successfully')
  } catch (error) {
    console.warn('[React19Fix] Failed to patch React internals:', error)
  }
})()

export {}