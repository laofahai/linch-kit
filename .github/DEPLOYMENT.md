# LinchKit CI/CD 部署配置

## GitHub Secrets 配置

为了让 CI/CD 流水线正常工作，需要在 GitHub 仓库中配置以下 Secrets：

### Vercel 相关 Secrets

1. **VERCEL_TOKEN**
   - 从 Vercel Dashboard > Settings > Tokens 创建
   - 需要有部署权限的 Token

2. **VERCEL_ORG_ID**
   - 值: `team_5pLYaT6fOm88ytmXT8sJznoC`
   - 这是 Vercel 团队/组织的 ID

3. **VERCEL_PROJECT_ID_STARTER**
   - 值: `prj_arMl5loRbJl3eiI62ZnRG9jatL6t`
   - Starter 应用的项目 ID

4. **VERCEL_PROJECT_ID_WEBSITE**
   - 值: `prj_3EuA6EszLwMg2axE4UnzAgExNabJ`
   - Website 应用的项目 ID

5. **VERCEL_PROJECT_ID_DEMO**
   - 值: `prj_nTSjXR5DdOqApLlojEPdZ0L7UvaZ`
   - Demo 应用的项目 ID

## CI/CD 流水线说明

### 触发条件

- `main` 分支推送时自动部署到生产环境
- `develop` 分支推送时进行构建和测试
- 对 `main` 分支的 PR 会进行构建和测试

### 部署流程

1. **Lint and Test**: 代码质量检查和单元测试
2. **Build Packages**: 构建所有包
3. **Deploy Apps**: 并行部署三个应用
   - Starter App → https://linch-kit-starter.vercel.app
   - Website → https://linch-kit-website.vercel.app
   - Demo App → https://linch-kit-demo-app.vercel.app
4. **E2E Tests**: 对部署后的应用进行端到端测试

### 应用配置映射

| 应用    | Vercel 配置文件        | 构建命令                            | 输出目录              |
| ------- | ---------------------- | ----------------------------------- | --------------------- |
| Starter | `vercel-starter.json`  | `cd apps/starter && bun run build`  | `apps/starter/.next`  |
| Website | `vercel-website.json`  | `cd apps/website && bun run build`  | `apps/website/.next`  |
| Demo    | `vercel-demo-app.json` | `cd apps/demo-app && bun run build` | `apps/demo-app/.next` |

## 手动部署命令

如需手动部署，可以使用以下命令：

```bash
# 部署 Starter 应用
cp vercel-starter.json vercel.json
vercel deploy --prod

# 部署 Website 应用
cp vercel-website.json vercel.json
vercel deploy --prod

# 部署 Demo 应用
cp vercel-demo-app.json vercel.json
vercel deploy --prod
```

## 验证部署

部署完成后，可以通过以下方式验证：

```bash
# 检查应用状态
curl -I https://linch-kit-starter.vercel.app
curl -I https://linch-kit-website.vercel.app
curl -I https://linch-kit-demo-app.vercel.app

# 或运行 E2E 测试
bun run test:e2e
```

## 故障排查

1. **构建失败**: 检查包依赖是否正确安装
2. **部署失败**: 验证 Vercel Token 和项目 ID
3. **应用无法访问**: 检查域名别名设置
4. **E2E 测试失败**: 确认应用已完全部署并可访问
