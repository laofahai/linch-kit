# 第四阶段实施计划：固化与交付 (v1.3)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**状态**: 待命

---

## 任务清单：质量保障 (QA)

- **[ ] Implement Unit Tests**: 
    - `[ ]` 使用 `bun test` 作为唯一的测试运行器。
    - `[ ]` 为所有 `packages` 的核心工具函数和类编写单元测试 (`*.test.ts`)。
    - `[ ]` 确保核心逻辑的单元测试覆盖率达到 90% 以上。

- **[ ] Implement E2E Tests**: 
    - `[ ]` 在 `tools/testing/e2e/` 目录中编写测试脚本。
    - `[ ]` 创建 `auth.spec.ts`, `extension.spec.ts`, `i18n.spec.ts` 等文件，覆盖所有关键用户流程。

---

## 任务清单：CI/CD 与文档

- **[ ] Refactor `.github/workflows/ci.yml`**:
    - `[ ]` 确保所有脚本都通过 `bun run` 执行。
    - `[ ]` 包含 `lint`, `test-unit`, `test-e2e` 等 jobs。
    - `[ ]` 为 `main` 分支设置必须通过所有 CI jobs 的保护规则。

- **[ ] Refactor Docs**:
    - `[ ]` 审查所有 `.md` 指南文件，确保命令示例都使用 `bun`。
    - `[ ]` 使用 `typedoc` 创建 `bun docs:api` 命令，生成 API 参考文档。

---

## 任务清单：正式发布

- **[ ] Configure Changesets**: 确保 `.changeset/config.json` 配置正确。
- **[ ] Define Release Process**:
    - `[ ]` 开发过程中，使用 `bun run changeset` 记录变更。
    - `[ ]` 发布时，创建 `release` 分支，运行 `bun run changeset version`。
    - `[ ]` 合并到 `main`，打上 `tag`，并触发 `release` workflow。
    - `[ ]` `release` workflow 负责对每个需要发布的包运行 `bun publish`。