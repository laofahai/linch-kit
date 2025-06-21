import { toast as sonnerToast } from "sonner"
import type { ExternalToast } from "sonner"

/**
 * @description Toast 选项接口，扩展 Sonner 的 ExternalToast
 * @since v1.0.0
 */
export interface ToastOptions extends ExternalToast {
  /** Toast 标题 */
  title?: string
  /** Toast 描述 */
  description?: string
  /** 持续时间（毫秒） */
  duration?: number
  /** 是否可关闭 */
  dismissible?: boolean
  /** 自定义图标 */
  icon?: React.ReactNode
  /** 操作按钮 */
  action?: {
    label: string
    onClick: () => void
  }
  /** 取消按钮 */
  cancel?: {
    label: string
    onClick?: () => void
  }
}

/**
 * @description 简化的 Toast API，提供常用的 Toast 通知方法
 * @since v1.0.0
 */
export const Toast = {
  /**
   * @description 显示成功 Toast
   * @param message - 消息内容
   * @param options - Toast 选项
   * @returns Toast ID
   * @example
   * ```tsx
   * Toast.success("操作成功")
   * Toast.success("数据已保存", { description: "用户信息已更新" })
   * ```
   * @since v1.0.0
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      ...options,
    })
  },

  /**
   * @description 显示错误 Toast
   * @param message - 错误消息
   * @param options - Toast 选项
   * @returns Toast ID
   * @example
   * ```tsx
   * Toast.error("操作失败")
   * Toast.error("网络错误", { description: "请检查网络连接" })
   * ```
   * @since v1.0.0
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      ...options,
    })
  },

  /**
   * @description 显示警告 Toast
   * @param message - 警告消息
   * @param options - Toast 选项
   * @returns Toast ID
   * @example
   * ```tsx
   * Toast.warning("请注意")
   * Toast.warning("数据即将过期", { description: "请及时更新" })
   * ```
   * @since v1.0.0
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      icon: "⚠️",
      ...options,
    })
  },

  /**
   * @description 显示信息 Toast
   * @param message - 信息内容
   * @param options - Toast 选项
   * @returns Toast ID
   * @example
   * ```tsx
   * Toast.info("提示信息")
   * Toast.info("新功能上线", { description: "点击查看详情" })
   * ```
   * @since v1.0.0
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      icon: "ℹ️",
      ...options,
    })
  },

  /**
   * @description 显示加载 Toast
   * @param message - 加载消息
   * @param options - Toast 选项
   * @returns Toast ID
   * @example
   * ```tsx
   * const loadingToast = Toast.loading("正在保存...")
   * // 完成后更新
   * Toast.success("保存成功", { id: loadingToast })
   * ```
   * @since v1.0.0
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration,
      ...options,
    })
  },

  /**
   * @description 显示 Promise Toast，自动处理加载、成功、错误状态
   * @param promise - Promise 对象
   * @param messages - 不同状态的消息
   * @param options - Toast 选项
   * @returns Promise 结果
   * @example
   * ```tsx
   * Toast.promise(
   *   saveUser(userData),
   *   {
   *     loading: "正在保存用户...",
   *     success: "用户保存成功",
   *     error: "保存失败"
   *   }
   * )
   * ```
   * @since v1.0.0
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, messages, options)
  },

  /**
   * @description 显示自定义 Toast
   * @param content - 自定义内容
   * @param options - Toast 选项
   * @returns Toast ID
   * @example
   * ```tsx
   * Toast.custom(
   *   <div>自定义内容</div>,
   *   { duration: 5000 }
   * )
   * ```
   * @since v1.0.0
   */
  custom: (content: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(content, options)
  },

  /**
   * @description 关闭指定的 Toast
   * @param id - Toast ID，如果不提供则关闭所有 Toast
   * @example
   * ```tsx
   * const toastId = Toast.info("消息")
   * Toast.dismiss(toastId)
   * // 或关闭所有
   * Toast.dismiss()
   * ```
   * @since v1.0.0
   */
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id)
  },
}

// 导出原始的 toast 函数以供高级用法
export { sonnerToast as toast }
