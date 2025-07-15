/**
 * 简单的样式测试页面
 */

export default function TestSimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">简单样式测试</h1>
      
      <div className="space-y-4">
        <div className="bg-primary text-primary-foreground p-4 rounded" style={{minHeight: '60px'}}>
          <p>Primary 背景测试</p>
          <p>如果你看到蓝色背景，说明样式生效了</p>
        </div>
        
        <div className="bg-secondary text-secondary-foreground p-4 rounded" style={{minHeight: '60px'}}>
          <p>Secondary 背景测试</p>
          <p>如果你看到灰色背景，说明样式生效了</p>
        </div>
        
        <div className="bg-red-500 text-white p-4 rounded" style={{minHeight: '60px'}}>
          <p>Tailwind 原生测试</p>
          <p>如果你看到红色背景，说明Tailwind基础功能正常</p>
        </div>
      </div>
    </div>
  );
}