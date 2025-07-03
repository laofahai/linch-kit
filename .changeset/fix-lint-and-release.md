---
"@linch-kit/schema": patch
---

fix: 修复lint错误和GitHub Actions release流程

- 修复schema包中未使用变量的lint错误，为函数名添加下划线前缀
- 修复GitHub Actions release workflow中tag_name访问错误
- 确保CI/CD流程通过并能正确发布版本