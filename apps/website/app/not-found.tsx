export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
      <h2 className="text-xl text-muted-foreground mb-4">页面未找到</h2>
      <p className="text-muted-foreground mb-6">
        抱歉，您访问的页面不存在。
      </p>
      <a 
        href="/" 
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        返回首页
      </a>
    </div>
  )
}