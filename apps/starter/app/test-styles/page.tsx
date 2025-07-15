/**
 * Tailwind CSS 样式测试页面
 * 验证 bg-primary 等样式是否正常工作
 */

export default function TestStylesPage() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">
        Tailwind CSS 样式测试
      </h1>
      
      {/* 主要颜色测试 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">主要颜色测试</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-lg">
            <p className="font-medium">Primary</p>
            <p className="text-sm">bg-primary</p>
          </div>
          <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">
            <p className="font-medium">Secondary</p>
            <p className="text-sm">bg-secondary</p>
          </div>
          <div className="bg-accent text-accent-foreground p-4 rounded-lg">
            <p className="font-medium">Accent</p>
            <p className="text-sm">bg-accent</p>
          </div>
          <div className="bg-muted text-muted-foreground p-4 rounded-lg">
            <p className="font-medium">Muted</p>
            <p className="text-sm">bg-muted</p>
          </div>
        </div>
      </div>

      {/* 卡片样式测试 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">卡片样式测试</h2>
        <div className="bg-card text-card-foreground p-6 rounded-lg border">
          <h3 className="font-medium mb-2">卡片标题</h3>
          <p className="text-sm text-muted-foreground">这是一个使用 bg-card 的卡片示例</p>
        </div>
      </div>

      {/* 按钮样式测试 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">按钮样式测试</h2>
        <div className="flex gap-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
            Primary 按钮
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90">
            Secondary 按钮
          </button>
          <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90">
            Destructive 按钮
          </button>
        </div>
      </div>

      {/* 边框和输入框测试 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">边框和输入框测试</h2>
        <div className="space-y-4">
          <div className="border border-border p-4 rounded-lg">
            <p>带边框的容器 (border-border)</p>
          </div>
          <input 
            type="text" 
            placeholder="输入框测试" 
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
          />
        </div>
      </div>

      {/* CSS 变量值显示 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">CSS 变量值显示</h2>
        <div className="bg-muted p-4 rounded-lg">
          <p className="font-mono text-sm">--primary: <span id="primary-value">Loading...</span></p>
          <p className="font-mono text-sm">--secondary: <span id="secondary-value">Loading...</span></p>
          <p className="font-mono text-sm">--accent: <span id="accent-value">Loading...</span></p>
        </div>
      </div>

      <script 
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const root = document.documentElement;
              const primary = getComputedStyle(root).getPropertyValue('--primary');
              const secondary = getComputedStyle(root).getPropertyValue('--secondary');
              const accent = getComputedStyle(root).getPropertyValue('--accent');
              
              document.getElementById('primary-value').textContent = primary || '未找到';
              document.getElementById('secondary-value').textContent = secondary || '未找到';
              document.getElementById('accent-value').textContent = accent || '未找到';
            });
          `
        }}
      />
    </div>
  );
}