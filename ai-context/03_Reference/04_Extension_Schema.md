# LinchKit Extension JSON Schema 规范

**版本**: v2.0.3  
**更新时间**: 2025-07-09  
**状态**: 技术规范

## 📋 概述

本文档定义了LinchKit Extension的JSON Schema规范，为开发者提供IDE自动补全、配置验证和类型安全保障。

## 🎯 设计目标

1. **零配置体验** - 开发者只需一行`$schema`即可获得完整IDE支持
2. **版本化管理** - Schema通过NPM包进行版本控制
3. **向后兼容** - 通过`allOf`扩展而非替换npm官方schema
4. **工具链集成** - 支持CLI验证、TypeScript类型生成、CI/CD流程

## 📦 包结构

```
packages/schema/
├── schemas/
│   ├── extension.v1.json    # 主schema文件
│   └── types.json           # 复用的类型定义
├── types/
│   └── extension.d.ts       # 自动生成的TypeScript类型
├── src/
│   ├── validate.ts          # 验证工具
│   └── generate-types.ts    # 类型生成工具
├── package.json
└── README.md
```

## 🔧 Schema 定义

### 核心Schema文件

```json
// packages/schema/schemas/extension.v1.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://schemas.linchkit.io/extension.v1.json",
  "title": "LinchKit Extension package.json",
  "description": "Schema for LinchKit extension package.json configuration",
  "type": "object",
  "allOf": [
    {
      "$ref": "https://json.schemastore.org/package"
    },
    {
      "properties": {
        "linchkit": {
          "type": "object",
          "description": "LinchKit extension metadata and configuration",
          "properties": {
            "displayName": {
              "type": "string",
              "description": "Human-readable name displayed in UI",
              "minLength": 1,
              "maxLength": 50
            },
            "capabilities": {
              "type": "object",
              "description": "Declares the technical capabilities of the extension",
              "properties": {
                "hasUI": {
                  "type": "boolean",
                  "description": "Extension provides frontend components or pages",
                  "default": false
                },
                "hasAPI": {
                  "type": "boolean",
                  "description": "Extension provides backend API endpoints",
                  "default": false
                },
                "hasSchema": {
                  "type": "boolean",
                  "description": "Extension defines data models",
                  "default": false
                },
                "hasHooks": {
                  "type": "boolean",
                  "description": "Extension listens to system hooks",
                  "default": false
                },
                "standalone": {
                  "type": "boolean",
                  "description": "Extension can run independently",
                  "default": false
                }
              },
              "additionalProperties": false
            },
            "category": {
              "type": "string",
              "description": "Extension category for marketplace",
              "enum": ["content", "ui", "integration", "analytics", "security", "workflow", "other"]
            },
            "tags": {
              "type": "array",
              "description": "Tags for extension discovery",
              "items": {
                "type": "string",
                "pattern": "^[a-z0-9-]+$"
              },
              "uniqueItems": true,
              "maxItems": 10
            },
            "permissions": {
              "type": "array",
              "description": "Required permissions for the extension",
              "items": {
                "type": "string",
                "pattern": "^[a-z]+:[a-z]+$",
                "examples": ["database:read", "database:write", "storage:read", "network:external"]
              },
              "uniqueItems": true
            },
            "configuration": {
              "type": "object",
              "description": "Extension configuration schema",
              "patternProperties": {
                "^[a-zA-Z][a-zA-Z0-9_]*$": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "enum": ["string", "number", "boolean", "array", "object"]
                    },
                    "default": true,
                    "description": { "type": "string" },
                    "required": { "type": "boolean", "default": false }
                  },
                  "required": ["type"]
                }
              },
              "additionalProperties": false
            },
            "icon": {
              "type": "string",
              "description": "Icon name or path for the extension",
              "pattern": "^[a-z0-9-]+$|^\\./.*\\.(svg|png|jpg)$"
            },
            "homepage": {
              "type": "string",
              "format": "uri",
              "description": "Extension homepage URL"
            },
            "repository": {
              "type": "string",
              "format": "uri",
              "description": "Extension source code repository URL"
            },
            "minCoreVersion": {
              "type": "string",
              "pattern": "^\\d+\\.\\d+\\.\\d+$",
              "description": "Minimum required LinchKit core version"
            }
          },
          "required": ["displayName", "capabilities"],
          "additionalProperties": false
        }
      },
      "required": ["linchkit"]
    }
  ]
}
```

### 类型定义文件

```json
// packages/schema/schemas/types.json
{
  "definitions": {
    "capability": {
      "type": "boolean",
      "default": false
    },
    "permission": {
      "type": "string",
      "pattern": "^[a-z]+:[a-z]+$"
    },
    "category": {
      "enum": ["content", "ui", "integration", "analytics", "security", "workflow", "other"]
    }
  }
}
```

## 🛠️ 开发者使用方式

### 1. 安装Schema包

```bash
# 安装schema包作为开发依赖
npm install --save-dev @linchkit/schema
```

### 2. 配置package.json

```json
{
  "name": "@myorg/linchkit-ext-blog",
  "version": "1.0.0",
  "$schema": "https://unpkg.com/@linchkit/schema@1.0.0/schemas/extension.v1.json",
  "description": "Blog extension for LinchKit",
  "linchkit": {
    "displayName": "博客系统",
    "capabilities": {
      "hasUI": true,
      "hasAPI": true,
      "hasSchema": true
    },
    "category": "content",
    "tags": ["blog", "cms", "content"],
    "permissions": ["database:read", "database:write"],
    "configuration": {
      "postsPerPage": {
        "type": "number",
        "default": 10,
        "description": "每页显示的文章数量"
      },
      "enableComments": {
        "type": "boolean",
        "default": true,
        "description": "是否启用评论功能"
      }
    },
    "icon": "newspaper",
    "homepage": "https://github.com/myorg/linchkit-ext-blog",
    "minCoreVersion": "1.2.0"
  }
}
```

### 3. IDE体验

配置完成后，IDE将提供：

- **自动补全** - 键入`linchkit.`时显示可用字段
- **类型验证** - 错误配置会显示红色下划线
- **文档提示** - 悬停时显示字段说明
- **枚举选择** - category、permissions等字段提供选项列表

## 🔍 验证工具

### CLI验证

```bash
# 验证当前目录的package.json
npx linchkit validate

# 验证指定文件
npx linchkit validate ./my-extension/package.json
```

### 程序化验证

```typescript
import { validateExtension } from '@linchkit/schema'

const result = await validateExtension('./package.json')
if (!result.valid) {
  console.error('Validation errors:', result.errors)
  process.exit(1)
}
```

### Pre-commit钩子

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "linchkit validate"
    }
  }
}
```

## 🔄 TypeScript集成

### 自动类型生成

```bash
# 构建时自动生成TypeScript类型
npx json-schema-to-typescript schemas/extension.v1.json > types/extension.d.ts
```

### 类型使用示例

```typescript
import type { LinchkitExtension } from '@linchkit/schema'

// 在核心代码中使用
function loadExtension(packageJson: any): LinchkitExtension {
  return packageJson.linchkit
}

// 扩展开发者也可以使用
const extensionConfig: LinchkitExtension = {
  displayName: 'My Extension',
  capabilities: {
    hasUI: true,
    hasAPI: false,
  },
}
```

## 📈 版本管理

### Schema版本策略

- **Major版本** - 破坏性变更（如移除字段）
- **Minor版本** - 新增字段或枚举值
- **Patch版本** - 文档更新、bug修复

### 版本引用

```json
{
  "$schema": "https://unpkg.com/@linchkit/schema@1.0.0/schemas/extension.v1.json"
}
```

### 向后兼容

新版本Schema必须向后兼容，确保旧版本的扩展配置仍然有效。

## 🚀 CI/CD集成

### GitHub Actions

```yaml
name: Validate Extension
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npx linchkit validate
```

### 发布流程

```yaml
name: Publish Extension
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate extension
        run: npx linchkit validate
      - name: Publish to NPM
        run: npm publish
```

## 📚 最佳实践

### 1. 字段规范

- **displayName** - 保持简洁，不超过50字符
- **category** - 选择最合适的分类，有助于用户发现
- **permissions** - 只申请必要的权限
- **configuration** - 提供合理的默认值

### 2. 版本兼容性

- 使用`minCoreVersion`声明最低版本要求
- 定期更新schema包到最新版本
- 测试新版本的兼容性

### 3. 文档维护

- 在README中说明扩展的功能和配置
- 提供配置示例和最佳实践
- 定期更新文档内容

## 🔧 故障排除

### 常见错误

1. **Schema不生效** - 检查`$schema`字段URL是否正确
2. **类型错误** - 确保字段类型符合schema定义
3. **权限格式错误** - 使用`domain:action`格式
4. **配置验证失败** - 检查required字段是否缺失

### 调试技巧

- 使用在线JSON Schema验证工具
- 查看IDE的错误提示详情
- 使用`linchkit validate --verbose`获取详细错误信息

---

**维护说明**: 本规范随LinchKit核心版本演进，请关注[更新日志](https://github.com/laofahai/linch-kit/blob/main/CHANGELOG.md)获取最新变更。
