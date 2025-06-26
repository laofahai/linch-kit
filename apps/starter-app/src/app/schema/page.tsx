import { SchemaDemo } from '@/components/schema/SchemaDemo'

export default function SchemaPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        LinchKit Schema驱动演示
      </h1>
      
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">🏗️ Schema驱动开发理念</h2>
        <p className="text-gray-700 mb-4">
          LinchKit 采用 Schema-First 方法，通过声明式定义自动生成类型安全的代码：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <strong className="text-blue-600">1. 定义Schema</strong>
            <p className="text-gray-600 mt-1">使用 defineEntity 和 defineField</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-green-600">2. 自动生成</strong>
            <p className="text-gray-600 mt-1">TypeScript类型、Prisma模型、API</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-purple-600">3. 类型安全</strong>
            <p className="text-gray-600 mt-1">端到端类型检查和验证</p>
          </div>
        </div>
      </div>

      <SchemaDemo />
    </div>
  )
}