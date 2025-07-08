'use client'

import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const getToastStyles = () => {
    const baseStyles = 'p-4 rounded-lg shadow-lg border-l-4 max-w-sm w-full'

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400 text-green-800 dark:bg-green-900 dark:text-green-200`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400 text-red-800 dark:bg-red-900 dark:text-red-200`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900 dark:text-blue-200`
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800 dark:bg-gray-900 dark:text-gray-200`
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        )
    }
  }

  return (
    <div
      className={`transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={getToastStyles()}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose(id), 300)
              }}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">关闭</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-right' }) => {
  const [toasts, setToasts] = useState<Array<Omit<ToastProps, 'onClose'>>>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const addToast = (toast: Omit<ToastProps, 'onClose'>) => {
    setToasts(prev => [...prev, toast])
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  // 全局方法，可以在任何地方调用
  useEffect(() => {
    window.addToast = addToast
    return () => {
      delete window.addToast
    }
  }, [])

  return (
    <div className={`fixed z-50 ${getPositionStyles()}`}>
      <div className="space-y-4">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </div>
  )
}

// 工具函数
export const toast = {
  success: (title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    if (window.addToast) {
      window.addToast({ id, type: 'success', title, message })
    }
  },
  error: (title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    if (window.addToast) {
      window.addToast({ id, type: 'error', title, message })
    }
  },
  warning: (title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    if (window.addToast) {
      window.addToast({ id, type: 'warning', title, message })
    }
  },
  info: (title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    if (window.addToast) {
      window.addToast({ id, type: 'info', title, message })
    }
  },
}

// 全局类型声明
declare global {
  interface Window {
    addToast?: (toast: Omit<ToastProps, 'onClose'>) => void
  }
}

export default Toast
