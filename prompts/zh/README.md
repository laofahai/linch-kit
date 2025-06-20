# Linch Kit AI 提示词库

这个目录包含了用于Linch Kit项目开发的AI提示词集合，帮助AI助手更好地理解和协助项目开发。

## 📁 目录结构

```
prompts/
├── README.md                    # 本文件
├── architecture/                # 架构设计相关提示词
│   ├── system-design.md        # 系统架构设计
│   ├── plugin-architecture.md  # 插件架构设计
│   └── database-design.md      # 数据库设计
├── code-generation/             # 代码生成相关提示词
│   ├── entity-generation.md    # 实体生成
│   ├── cli-commands.md         # CLI命令生成
│   └── schema-generation.md    # Schema生成
├── testing/                     # 测试验证相关提示词
│   ├── unit-testing.md         # 单元测试
│   ├── integration-testing.md  # 集成测试
│   └── validation.md           # 验证策略
└── configuration/               # 配置管理相关提示词
    ├── project-setup.md        # 项目配置
    ├── environment.md          # 环境配置
    └── deployment.md           # 部署配置
```

## 🎯 使用场景

### 1. 架构设计
当需要设计或修改系统架构时，使用 `architecture/` 目录下的提示词。

### 2. 代码生成
当需要生成新的实体、命令或schema时，使用 `code-generation/` 目录下的提示词。

### 3. 测试验证
当需要编写测试或验证功能时，使用 `testing/` 目录下的提示词。

### 4. 配置管理
当需要配置项目、环境或部署时，使用 `configuration/` 目录下的提示词。

## 🤖 AI助手使用指南

1. **选择合适的提示词**: 根据当前任务选择最相关的提示词文件
2. **组合使用**: 可以组合多个提示词来处理复杂任务
3. **上下文理解**: 提示词包含了项目的上下文信息，帮助AI更好地理解需求
4. **最佳实践**: 每个提示词都包含了相关领域的最佳实践

## 📝 提示词格式

每个提示词文件都遵循以下格式：

```markdown
# 标题

## 目的
描述这个提示词的用途和目标

## 上下文
提供相关的背景信息和项目上下文

## 任务描述
具体的任务要求和期望输出

## 示例
提供具体的示例和模板

## 最佳实践
相关的最佳实践和注意事项
```

## 🔄 更新维护

- 定期更新提示词以反映项目的最新状态
- 根据实际使用情况优化提示词内容
- 添加新的使用场景和示例
- 收集反馈并持续改进
