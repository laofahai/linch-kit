# LinchKit 架构分析报告

生成时间: 7/6/2025, 3:09:12 PM

## 📊 总体概览

- **包总数**: 7
- **总文件数**: 216
- **总代码行数**: 47,605
- **测试文件比例**: 19.4%
- **循环依赖**: ✅ 无

## 📦 包依赖分析

### 内部依赖关系

#### @linch-kit/auth
- @linch-kit/core (workspace:*)
- @linch-kit/schema (workspace:*)

#### @linch-kit/crud
- @linch-kit/core (workspace:*)
- @linch-kit/schema (workspace:*)
- @linch-kit/auth (workspace:*)

#### @linch-kit/schema
- @linch-kit/core (workspace:*)

#### @linch-kit/trpc
- @linch-kit/core (workspace:*)
- @linch-kit/schema (workspace:*)
- @linch-kit/auth (workspace:*)

#### @linch-kit/ui
- @linch-kit/core (workspace:*)
- @linch-kit/schema (workspace:*)
- @linch-kit/auth (workspace:*)
- @linch-kit/crud (workspace:*)

## 📈 代码规模分析

| 包名 | 文件数 | 代码行数 | 测试文件数 |
|------|--------|----------|------------|
| auth | 28 | 5,313 | 9 |
| core | 59 | 12,953 | 8 |
| create-linch-kit | 2 | 244 | 0 |
| crud | 36 | 14,001 | 12 |
| schema | 35 | 7,600 | 7 |
| trpc | 10 | 3,493 | 5 |
| ui | 46 | 4,001 | 1 |

## 🔍 架构层级分析

### L0 层
- **@linch-kit/core**

### L1 层
- **@linch-kit/schema**
  - 依赖: @linch-kit/core

### L2 层
- **@linch-kit/auth**
  - 依赖: @linch-kit/core, @linch-kit/schema
- **@linch-kit/crud**
  - 依赖: @linch-kit/core, @linch-kit/schema, @linch-kit/auth

### L3 层
- **@linch-kit/trpc**
  - 依赖: @linch-kit/core, @linch-kit/schema, @linch-kit/auth
- **@linch-kit/ui**
  - 依赖: @linch-kit/core, @linch-kit/schema, @linch-kit/auth, @linch-kit/crud

### L4 层

