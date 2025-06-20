# Linch Kit 生产部署指导

## 目的

指导 AI 助手进行 Linch Kit 项目的生产环境部署，确保部署的安全性、稳定性和可维护性。

## 上下文

**参考文档**:
- `ai-context/zh/workflows/release.md` - 发布流程
- `ai-context/zh/reference/deployment-configurations.md` - 部署配置文件
- `ai-context/zh/decisions/publishing-strategy.md` - 发布策略

Linch Kit 支持多种部署方式，推荐使用 Vercel 进行快速部署。

## 部署方式选择

### 1. Vercel 部署 (推荐)

**适用场景**: 
- 快速原型和演示
- 中小型应用
- 需要全球 CDN

**优势**:
- 零配置部署
- 自动 HTTPS
- 全球 CDN
- 自动扩缩容

### 2. Docker 部署

**适用场景**:
- 企业级应用
- 需要完全控制
- 混合云部署

**优势**:
- 环境一致性
- 易于扩展
- 完全控制

### 3. 传统服务器部署

**适用场景**:
- 现有基础设施
- 特殊安全要求
- 成本控制

## 部署流程

### Vercel 部署流程

**步骤**:
1. **准备配置**: 创建 `vercel.json` 配置文件
2. **设置环境变量**: 在 Vercel 控制台配置环境变量
3. **连接仓库**: 连接 GitHub 仓库
4. **自动部署**: 推送代码自动触发部署

**配置文件**: 参考 `ai-context/zh/reference/deployment-configurations.md#vercel-部署配置`

### Docker 部署流程

**步骤**:
1. **创建 Dockerfile**: 使用多阶段构建
2. **配置 Docker Compose**: 包含应用、数据库、Redis
3. **构建镜像**: `docker build -t linchkit .`
4. **启动服务**: `docker-compose up -d`

**配置文件**: 参考 `ai-context/zh/reference/deployment-configurations.md#docker-部署配置`

## 环境配置

### 必需环境变量

```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/database"

# 认证
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# 第三方服务 (可选)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 安全配置

**重要原则**:
- 使用强随机密钥
- 启用 HTTPS
- 配置安全头
- 定期轮换密钥

**详细配置**: 参考 `ai-context/zh/reference/deployment-configurations.md#安全配置`

## 数据库部署

### 数据库选择

**推荐方案**:
- **Supabase**: 托管 PostgreSQL，易于使用
- **PlanetScale**: 托管 MySQL，无服务器
- **Railway**: 简单的数据库托管
- **自建**: 使用 Docker 或云服务器

### 数据库迁移

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate deploy

# 验证迁移状态
pnpm prisma migrate status
```

### 数据备份

**备份策略**:
- 自动定期备份
- 保留多个备份版本
- 测试备份恢复流程

**备份脚本**: 参考 `ai-context/zh/reference/deployment-configurations.md#备份策略`

## 监控和维护

### 健康检查

**端点**: `/api/health`

**检查项目**:
- 数据库连接
- 应用状态
- 内存使用
- 响应时间

**实现**: 参考 `ai-context/zh/reference/deployment-configurations.md#健康检查端点`

### 日志管理

**日志级别**:
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

**日志配置**: 参考 `ai-context/zh/reference/deployment-configurations.md#日志配置`

### 性能监控

**关键指标**:
- 响应时间
- 错误率
- 内存使用
- 数据库性能

## 部署检查清单

### 部署前检查
- [ ] 所有测试通过
- [ ] 环境变量配置正确
- [ ] 数据库迁移准备就绪
- [ ] 安全配置完成
- [ ] 备份策略实施

### 部署过程检查
- [ ] 构建成功
- [ ] 数据库迁移执行
- [ ] 应用启动正常
- [ ] 健康检查通过

### 部署后验证
- [ ] 应用正常访问
- [ ] 关键功能测试
- [ ] 性能指标正常
- [ ] 监控告警配置

## 故障排除

### 常见问题

**部署失败**:
1. 检查构建日志
2. 验证环境变量
3. 确认依赖安装
4. 检查配置文件

**数据库连接失败**:
1. 验证连接字符串
2. 检查网络连接
3. 确认数据库状态
4. 查看防火墙设置

**应用无法访问**:
1. 检查端口配置
2. 验证域名解析
3. 确认负载均衡
4. 查看安全组设置

### 回滚策略

**快速回滚**:
1. 使用平台回滚功能 (Vercel)
2. 切换到上一个稳定版本
3. 恢复数据库备份 (如需要)
4. 验证回滚结果

**回滚脚本**: 参考 `ai-context/zh/reference/deployment-configurations.md#回滚脚本`

## 最佳实践

### 1. 部署策略
- 使用蓝绿部署或滚动更新
- 实施渐进式发布
- 保持环境一致性

### 2. 安全实践
- 定期更新依赖
- 使用最小权限原则
- 启用安全监控

### 3. 性能优化
- 启用缓存
- 优化数据库查询
- 使用 CDN

### 4. 监控告警
- 设置关键指标告警
- 建立故障响应流程
- 定期检查系统状态

---

**使用说明**:
1. 根据项目需求选择合适的部署方式
2. 严格遵循安全配置要求
3. 建立完善的监控和备份机制
4. 制定详细的回滚计划

**相关文档**:
- [发布流程](../../ai-context/zh/workflows/release.md)
- [部署配置文件](../../ai-context/zh/reference/deployment-configurations.md)
- [发布策略](../../ai-context/zh/decisions/publishing-strategy.md)
