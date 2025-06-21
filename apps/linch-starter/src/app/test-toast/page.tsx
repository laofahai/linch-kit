"use client"

import { Toast } from '@linch-kit/ui'

/**
 * @description Toast 测试页面，演示各种 Toast 功能
 * @since v1.0.0
 */
export default function TestToastPage() {
  const handleSuccessToast = () => {
    Toast.success("操作成功！", {
      description: "数据已成功保存到数据库"
    })
  }

  const handleErrorToast = () => {
    Toast.error("操作失败！", {
      description: "网络连接错误，请稍后重试"
    })
  }

  const handleWarningToast = () => {
    Toast.warning("请注意！", {
      description: "您的会话即将过期"
    })
  }

  const handleInfoToast = () => {
    Toast.info("提示信息", {
      description: "新功能已上线，点击查看详情"
    })
  }

  const handleLoadingToast = () => {
    const loadingToast = Toast.loading("正在处理...")
    
    // 模拟异步操作
    setTimeout(() => {
      Toast.dismiss(loadingToast)
      Toast.success("处理完成！")
    }, 3000)
  }

  const handlePromiseToast = () => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ name: "用户数据" })
        } else {
          reject(new Error("网络错误"))
        }
      }, 2000)
    })

    Toast.promise(mockPromise, {
      loading: "正在保存用户数据...",
      success: (data: any) => `${data.name} 保存成功！`,
      error: "保存失败，请重试"
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Toast 通知系统测试
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={handleSuccessToast}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            成功 Toast
          </button>

          <button
            onClick={handleErrorToast}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            错误 Toast
          </button>

          <button
            onClick={handleWarningToast}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            警告 Toast
          </button>

          <button
            onClick={handleInfoToast}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            信息 Toast
          </button>

          <button
            onClick={handleLoadingToast}
            className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            加载 Toast
          </button>

          <button
            onClick={handlePromiseToast}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Promise Toast
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            使用说明
          </h2>
          <p className="text-gray-600 text-sm">
            点击上方按钮测试不同类型的 Toast 通知。Toast 系统基于 Sonner 库构建，
            提供了简洁的 API 和优秀的用户体验。
          </p>
        </div>
      </div>
    </div>
  )
}
