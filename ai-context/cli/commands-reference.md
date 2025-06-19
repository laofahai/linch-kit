# Linch Kit CLI 命令参考

## 全局选项

```bash
linch [options] [command]

Options:
  -V, --version           显示版本号
  -v, --verbose          启用详细输出
  -s, --silent           静默模式
  --config <path>        指定配置文件路径
  --cwd <path>           工作目录
  -h, --help             显示帮助信息
```

## 项目管理命令

### init
初始化新的Linch Kit项目

```bash
linch init [options] [project-name]

Options:
  -t, --template <name>   使用指定模板
  -f, --force            强制覆盖现有文件
```

## 配置管理命令

### config:show
显示当前配置

```bash
linch config:show [options]

Options:
  --format <type>        输出格式 (json|yaml|table)
```

### config:set
设置配置值

```bash
linch config:set <key> <value>

Examples:
  linch config:set database.provider postgresql
  linch config:set auth.providers.0.type credentials
```

### config:get
获取配置值

```bash
linch config:get <key>

Examples:
  linch config:get database.url
  linch config:get auth.session.maxAge
```

### config:validate
验证当前配置

```bash
linch config:validate [options]

Options:
  --fix                  自动修复可修复的问题
```

## 插件管理命令

### plugin:list
列出所有已发现和已加载的插件

```bash
linch plugin:list [options]

Options:
  -v, --verbose          显示详细插件信息
  --loaded-only          只显示已加载的插件
  --discovered-only      只显示已发现的插件
```

### plugin:install
安装插件

```bash
linch plugin:install [options] <plugin-name>

Options:
  --version <version>    安装指定版本
  --dev                  作为开发依赖安装

Examples:
  linch plugin:install @linch-kit/plugin-auth
  linch plugin:install my-custom-plugin --version 1.2.0
```

### plugin:uninstall
卸载插件

```bash
linch plugin:uninstall <plugin-name>

Examples:
  linch plugin:uninstall @linch-kit/plugin-auth
  linch plugin:uninstall my-custom-plugin
```

### plugin:info
显示插件详细信息

```bash
linch plugin:info <plugin-name>

Examples:
  linch plugin:info @linch-kit/schema
  linch plugin:info @linch-kit/auth-core
```

## Schema管理命令

### schema:init
初始化schema配置

```bash
linch schema:init [options]

Options:
  -f, --force            覆盖现有配置文件
```

### schema:generate:prisma
从实体定义生成Prisma schema

```bash
linch schema:generate:prisma [options]

Options:
  -o, --output <path>    输出文件路径 (默认: ./prisma/schema.prisma)
  -e, --entities-path <path>  实体文件路径
  --watch                监听文件变化
```

### schema:generate:validators
从实体定义生成Zod验证器

```bash
linch schema:generate:validators [options]

Options:
  -o, --output <path>    输出文件路径 (默认: ./src/validators/generated.ts)
  -e, --entities-path <path>  实体文件路径
```

### schema:list
列出所有注册的实体

```bash
linch schema:list

显示所有已注册的实体及其基本信息
```

### schema:show
显示实体详细信息

```bash
linch schema:show <entityName>

Examples:
  linch schema:show User
  linch schema:show Product
```

## 数据库管理命令 (计划中)

### db:generate
生成数据库相关代码

```bash
linch db:generate [options]

Options:
  --repositories         生成Repository类
  --services            生成Service类
  --types               生成TypeScript类型
```

### db:migrate
运行数据库迁移

```bash
linch db:migrate [options]

Options:
  --name <name>         迁移名称
  --preview             预览迁移但不执行
```

### db:seed
数据库数据填充

```bash
linch db:seed [options]

Options:
  --file <path>         指定填充文件
  --env <environment>   指定环境
```

### db:reset
重置数据库

```bash
linch db:reset [options]

Options:
  --force               强制重置，不询问确认
```

### db:studio
启动Prisma Studio

```bash
linch db:studio [options]

Options:
  --port <port>         指定端口 (默认: 5555)
```

## 开发工具命令

### dev
启动开发服务器

```bash
linch dev [args]

委托给 npm run dev, Next.js 或 Turborepo
```

### build
构建生产版本

```bash
linch build [args]

委托给 npm run build, Next.js 或 Turborepo
```

### test
运行测试

```bash
linch test [args]

委托给 npm run test, Jest, Vitest 或 Turborepo
```

## 命令分类

### 项目管理
- `init` - 项目初始化

### 配置管理
- `config:show` - 显示配置
- `config:set` - 设置配置
- `config:get` - 获取配置
- `config:validate` - 验证配置

### 插件管理
- `plugin:list` - 列出插件
- `plugin:install` - 安装插件
- `plugin:uninstall` - 卸载插件
- `plugin:info` - 插件信息

### Schema管理
- `schema:init` - 初始化schema
- `schema:generate:prisma` - 生成Prisma schema
- `schema:generate:validators` - 生成验证器
- `schema:list` - 列出实体
- `schema:show` - 显示实体详情

### 开发工具
- `dev` - 开发服务器
- `build` - 构建
- `test` - 测试

## 使用示例

```bash
# 创建新项目
linch init my-project --template enterprise

# 配置数据库
linch config:set database.provider postgresql
linch config:set database.url "postgresql://localhost:5432/mydb"

# 安装插件
linch plugin:install @linch-kit/auth-core

# 生成代码
linch schema:generate:prisma
linch schema:generate:validators

# 开发
linch dev
```
