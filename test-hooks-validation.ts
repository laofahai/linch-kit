// Hooks 测试文件 - 验证 Claude Code Hooks 是否正常触发
// 创建时间: 2025-07-22

export interface HooksTestInterface {
  testId: string
  message: string
  timestamp: Date
}

export const createHooksTest = (message: string): HooksTestInterface => {
  return {
    testId: 'hooks-test-' + Date.now(),
    message,
    timestamp: new Date()
  }
}

console.log('🧪 Hooks 测试文件已创建')

export function validateHooksWorking(): string {
  return "Hooks system is working! 🎉"
}