export const metadata = {
  title: '快速开始 - Linch Kit',
  description: '几分钟内学会创建您的第一个 Linch Kit 应用程序'
}

export default function GettingStartedPage() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1>快速开始</h1>

      <p>本指南将帮助您在几分钟内创建您的第一个 Linch Kit 应用程序。</p>

      <h2>前置要求</h2>

      <p>开始之前，请确保您已安装以下软件：</p>

      <ul>
        <li><strong>Node.js</strong> 18.0 或更高版本</li>
        <li><strong>npm</strong>、<strong>yarn</strong> 或 <strong>pnpm</strong> 包管理器</li>
        <li><strong>Git</strong> 版本控制工具</li>
      </ul>

      <h2>安装</h2>

      <h3>创建新项目</h3>

      <p>最快的开始方式是使用我们的 CLI 工具：</p>

      <pre><code>npx create-linch-app my-app</code></pre>

      <p>此命令将：</p>
      <ul>
        <li>创建一个以您的项目名称命名的新目录</li>
        <li>安装所有必要的依赖项</li>
        <li>设置基本的项目结构</li>
        <li>配置开发工具</li>
      </ul>

      <h3>进入项目目录</h3>

      <pre><code>cd my-app</code></pre>

      <h3>启动开发服务器</h3>

      <pre><code>{`npm run dev
# or
yarn dev
# or
pnpm dev`}</code></pre>

      <p>在浏览器中打开 <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">http://localhost:3000</a> 查看您的应用程序运行情况。</p>

      <h2>您的第一个实体</h2>

      <p>让我们创建您的第一个数据实体：</p>

      <pre><code>{`import { z } from 'zod'
import { defineEntity, primary, unique, createdAt, updatedAt } from '@linch-kit/schema'

export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string(),
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})`}</code></pre>

      <h2>生成数据库模式</h2>

      <p>运行以下命令生成您的数据库模式：</p>

      <pre><code>npx linch schema:generate</code></pre>

      <h2>下一步</h2>

      <p>恭喜！您现在拥有一个可工作的 Linch Kit 应用程序。接下来您可以：</p>

      <ul>
        <li><a href="/docs/core-concepts">学习核心概念</a> - 了解 Linch Kit 的工作原理</li>
        <li><a href="/docs/api">探索 API</a> - 了解可用的 API</li>
        <li><a href="/docs/examples">查看示例</a> - 学习实际应用案例</li>
      </ul>
    </div>
  )
}
