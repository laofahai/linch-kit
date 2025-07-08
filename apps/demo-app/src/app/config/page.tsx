import { ConfigDemo } from '@/components/config/ConfigDemo'

export default function ConfigPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">LinchKit 配置管理演示</h1>

      <div className="bg-green-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">⚙️ 企业级配置管理</h2>
        <p className="text-gray-700 mb-4">
          LinchKit 提供灵活的配置管理系统，支持多种配置源和环境隔离：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <strong className="text-green-600">多租户支持</strong>
            <p className="text-gray-600 mt-1">租户级别配置隔离</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-blue-600">环境管理</strong>
            <p className="text-gray-600 mt-1">开发/测试/生产环境</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-purple-600">热重载</strong>
            <p className="text-gray-600 mt-1">运行时配置更新</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-orange-600">类型安全</strong>
            <p className="text-gray-600 mt-1">TypeScript类型检查</p>
          </div>
        </div>
      </div>

      <ConfigDemo />
    </div>
  )
}
