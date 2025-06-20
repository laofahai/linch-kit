export const metadata = {
  title: '文档 - Linch Kit',
  description: 'Linch Kit 完整文档 - AI 优先全栈框架'
}

export default function DocsPage() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1>欢迎使用 Linch Kit</h1>

      <p>
        Linch Kit 是一个 AI 优先的全栈框架，旨在加速企业级应用程序开发。
        基于 TypeScript 构建，它提供了一个全面的工具包，用于以前所未有的速度和效率构建现代化、可扩展的应用程序。
      </p>

      <h2>什么是 Linch Kit？</h2>

      <p>Linch Kit 不仅仅是一个框架——它是一个完整的开发生态系统，结合了：</p>

      <ul>
        <li><strong>模式驱动开发</strong> 使用 Zod 进行类型安全的数据建模</li>
        <li><strong>AI 驱动的代码生成</strong> 用于快速原型设计和开发</li>
        <li><strong>插件架构</strong> 提供可扩展的功能</li>
        <li><strong>企业级特性</strong> 用于生产就绪的应用程序</li>
      </ul>

      <h2>核心特性</h2>

      <h3>🤖 AI 优先开发</h3>
      <ul>
        <li>智能代码生成和脚手架</li>
        <li>AI 辅助调试和优化</li>
        <li>自动化测试和文档生成</li>
      </ul>

      <h3>⚡ 模式驱动架构</h3>
      <ul>
        <li>使用 Zod 一次定义数据模型</li>
        <li>自动生成 API、表单和数据库模式</li>
        <li>整个应用程序的类型安全</li>
      </ul>

      <h3>🛡️ 企业级就绪</h3>
      <ul>
        <li>内置身份验证和授权</li>
        <li>审计日志和合规性功能</li>
        <li>高可用性和可扩展性</li>
      </ul>

      <h3>🔧 插件生态系统</h3>
      <ul>
        <li>可扩展的插件架构</li>
        <li>即用型业务模块（WMS、CRM、工作流）</li>
        <li>社区驱动的插件市场</li>
      </ul>

      <h2>快速开始</h2>

      <p>几分钟内开始使用 Linch Kit：</p>

      <pre><code>{`npx create-linch-app my-app
cd my-app
npm run dev`}</code></pre>

      <p>就是这样！您现在拥有一个功能齐全的应用程序，包括：</p>
      <ul>
        <li>自动生成的管理界面</li>
        <li>类型安全的 API 端点</li>
        <li>数据库集成</li>
        <li>身份验证系统</li>
      </ul>

      <h2>下一步</h2>

      <ul>
        <li><a href="/docs/getting-started">快速开始</a> - 设置您的第一个项目</li>
        <li><a href="/docs/api">API 参考</a> - 探索完整的 API</li>
        <li><a href="/docs/examples">示例</a> - 查看真实世界的实现</li>
      </ul>

      <h2>社区</h2>

      <p>加入我们不断壮大的开发者社区：</p>

      <ul>
        <li><a href="https://github.com/laofahai/linch-kit" target="_blank" rel="noopener noreferrer">GitHub</a> - 源代码和问题</li>
      </ul>
    </div>
  )
}
