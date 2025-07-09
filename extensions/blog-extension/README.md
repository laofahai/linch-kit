# Blog Extension

完整的博客功能实现，包含文章管理、分类标签、评论系统等

## 功能特性

- ✅ Schema - 完整的博客数据模型定义
- ✅ API - 全面的博客API接口
- ✅ UI - 丰富的博客界面组件
- ✅ Hooks - 实用的React Hooks

## 核心功能

### 📝 文章管理
- 文章创建、编辑、发布
- 文章状态管理（草稿、已发布、已归档）
- 文章分类和标签
- 文章搜索和筛选
- 文章统计和分析

### 📂 分类管理
- 分类层级结构
- 分类统计信息
- 分类颜色和图标

### 🏷️ 标签管理
- 标签云展示
- 标签统计信息
- 标签颜色配置

### 💬 评论系统
- 评论审核机制
- 评论回复功能
- 评论点赞系统
- 垃圾评论过滤

### 📊 统计分析
- 文章浏览量统计
- 点赞数统计
- 评论数统计
- 日常数据分析

## 数据模型

### BlogPost（文章）
```typescript
{
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  categoryId?: string
  tags: string[]
  authorId: string
  viewCount: number
  likeCount: number
  commentCount: number
  featured: boolean
  allowComments: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords: string[]
  createdAt: Date
  updatedAt: Date
}
```

### BlogCategory（分类）
```typescript
{
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  sortOrder: number
  postCount: number
  createdAt: Date
  updatedAt: Date
}
```

### BlogTag（标签）
```typescript
{
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  postCount: number
  createdAt: Date
  updatedAt: Date
}
```

### BlogComment（评论）
```typescript
{
  id: string
  postId: string
  authorId?: string
  authorName: string
  authorEmail: string
  authorWebsite?: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  parentId?: string
  ipAddress?: string
  userAgent?: string
  likeCount: number
  createdAt: Date
  updatedAt: Date
}
```

## API 接口

### 基础 CRUD
- `POST /api/blog/posts` - 创建文章
- `GET /api/blog/posts` - 获取文章列表
- `GET /api/blog/posts/:id` - 获取文章详情
- `PUT /api/blog/posts/:id` - 更新文章
- `DELETE /api/blog/posts/:id` - 删除文章

### 扩展接口
- `GET /api/blog/getFeaturedPosts` - 获取精选文章
- `GET /api/blog/getPostBySlug` - 根据slug获取文章
- `POST /api/blog/publishPost` - 发布文章
- `POST /api/blog/incrementViewCount` - 增加浏览量
- `POST /api/blog/likePost` - 点赞文章
- `GET /api/blog/getPostStats` - 获取文章统计
- `GET /api/blog/searchPosts` - 搜索文章

## UI 组件

### 核心组件
- `BlogPostCard` - 文章卡片
- `BlogPostList` - 文章列表
- `BlogCategoryList` - 分类列表
- `BlogTagCloud` - 标签云
- `BlogCommentList` - 评论列表
- `BlogStatsDashboard` - 统计面板
- `BlogAdminPanel` - 管理面板
- `BlogHomepage` - 博客首页

### 使用示例
```typescript
import { BlogPostList, BlogCategoryList } from './components'

function BlogPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        <BlogPostList posts={posts} />
      </div>
      <div className="space-y-6">
        <BlogCategoryList categories={categories} />
      </div>
    </div>
  )
}
```

## Hooks

### 数据获取 Hooks
- `useBlogPosts` - 获取文章列表
- `useBlogPost` - 获取单篇文章
- `useBlogCategories` - 获取分类列表
- `useBlogTags` - 获取标签列表
- `useBlogSearch` - 博客搜索

### 操作 Hooks
- `useBlogPostActions` - 文章操作（点赞、浏览量）
- `useBlogAdmin` - 博客管理功能

### 使用示例
```typescript
import { useBlogPosts, useBlogCategories } from './hooks'

function BlogPage() {
  const { posts, loading, error } = useBlogPosts({ limit: 10 })
  const { categories } = useBlogCategories()
  
  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>
  
  return (
    <BlogPostList posts={posts} />
  )
}
```

## 安装

```bash
linch-kit extension create blog-extension --template blog
```

## 开发

```bash
# 开发模式
bun dev

# 构建
bun build

# 测试
bun test

# 代码检查
bun lint
```

## 部署

1. 构建Extension
```bash
bun build
```

2. 在LinchKit应用中加载Extension
```typescript
import { extensionManager } from '@linch-kit/core/extension'

// 加载Blog Extension
await extensionManager.loadExtension('blog-extension')
```

3. 使用Blog Extension功能
```typescript
// 使用API
import { api } from 'blog-extension'

// 使用组件
import { BlogHomepage } from 'blog-extension'

// 使用Hooks
import { useBlogPosts } from 'blog-extension'
```

## 配置

Extension配置位于 `package.json` 的 `linchkit` 字段中：

```json
{
  "linchkit": {
    "displayName": "Blog Extension",
    "category": "content",
    "capabilities": {
      "hasSchema": true,
      "hasAPI": true,
      "hasUI": true,
      "hasHooks": true
    },
    "permissions": [
      "database:read",
      "database:write",
      "api:read",
      "api:write",
      "ui:render",
      "system:hooks"
    ]
  }
}
```

## 扩展

### 添加新的文章类型
1. 扩展 `BlogPost` Schema
2. 添加相应的API接口
3. 创建对应的UI组件

### 集成富文本编辑器
1. 安装编辑器依赖
2. 创建编辑器组件
3. 集成到文章创建/编辑流程

### 添加文章导入/导出功能
1. 创建导入/导出API
2. 支持多种格式（Markdown、HTML等）
3. 添加批量操作功能

## 贡献

欢迎提交Issue和Pull Request来改进这个Extension。

## 许可证

MIT