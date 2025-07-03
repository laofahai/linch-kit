---
"@linch-kit/core": patch
"@linch-kit/schema": patch
"@linch-kit/trpc": patch
"@linch-kit/starter": patch
---

fix: 修复TypeScript类型错误和CLI功能

- 修复core包中i18n函数参数类型错误，确保类型安全
- 修复schema包中CLI命令导出错误，删除不存在的命令导出
- 修复trpc包中any类型警告，替换为unknown类型
- 修复starter包中TypeScript严格模式错误
- 删除文档中的硬编码版本号，便于维护
- 扩展CLI类别支持，添加trpc、auth、crud、ui类别