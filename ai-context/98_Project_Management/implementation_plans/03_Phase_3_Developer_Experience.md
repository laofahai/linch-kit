# 第三阶段实施计划：开发者体验 (v1.3)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**状态**: 待命

---

## 任务清单：范例与文档

- **[ ] Audit `extensions/example-counter`**: 审查代码，确保其 API 调用遵循最新规范。
- **[ ] Audit `extensions/console`**: 同上。

- **[ ] Refactor Examples**: 
    - `[ ]` 为两个范例项目添加详细的 `README.md`。
    - `[ ]` 为关键代码（如 `register.ts`）添加清晰注释。

- **[ ] Implement `docs/extension-development-guide.md`**:
    - `[ ]` 撰写指南，覆盖从快速开始到发布的完整流程。
    - `[ ]` 确保所有示例代码都使用 `bun` 命令。

---

## 任务清单：脚手架

- **[ ] Create Package `packages/create-linch-kit-extension`**.
- **[ ] Setup**: `bun add commander`.
- **[ ] Implement `template/`**: 在包内创建 `template/` 目录，存放一个最小化的扩展项目骨架。
- **[ ] Implement CLI**: 编写主程序逻辑，实现 `bunx create-linch-kit-extension <dir>` 命令。
- **[ ] Publish**: 将此包发布到 npm。