import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Linch Starter
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-First rapid development with Linch Kit
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Features */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI-First Design</h3>
            <p className="text-gray-600">
              Built for AI understanding and code generation
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Type Safety</h3>
            <p className="text-gray-600">
              Full TypeScript support with Zod validation
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Rapid Development</h3>
            <p className="text-gray-600">
              Schema-driven development with automatic generation
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold mb-2">Authentication</h3>
            <p className="text-gray-600">
              Built-in auth with NextAuth.js integration
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🗄️</div>
            <h3 className="text-lg font-semibold mb-2">Database Ready</h3>
            <p className="text-gray-600">
              Prisma integration with PostgreSQL
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="text-lg font-semibold mb-2">Developer Tools</h3>
            <p className="text-gray-600">
              Rich CLI and development experience
            </p>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Explore the Demo
          </h2>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/products" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Products
            </Link>
            <Link 
              href="/users" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage Users
            </Link>
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🚀 Getting Started</h3>
          <div className="text-left max-w-2xl mx-auto">
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`# Install Linch Kit CLI
npm install -g @linch-kit/core

# Create a new project
linch init my-app

# Start development
cd my-app
npm run dev`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
