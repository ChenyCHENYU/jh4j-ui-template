# 模板更新回流指南（衍生项目如何吸收模板升级）

模板持续演进（见 [changelog](./changelog.md)），但衍生项目创建后与模板分叉，**模板更新不会自动到达已创建的项目**。本指南定义安全吸收模板更新的流程。

## 前提：创建项目时保留模板远程（强烈建议）

```bash
git clone <template-repository> my-project
cd my-project
git remote rename origin origin-template   # 模板远程改名保留
git remote add origin <your-project-repository>
git push -u origin main
```

经内部脚手架创建的项目，可事后补挂：

```bash
git remote add template <template-repository>
```

## 吸收更新的标准流程

```bash
# 1. 获取模板最新（tag 是稳定基线，比 main 更安全）
git fetch template --tags
git checkout -b chore/sync-template-v1.4.0
git merge v1.4.0 --no-commit        # 模板基线 tag；冲突先不提交

# 2. 冲突处理原则（按此优先级决策）
#    - project.config.json / .jhlc/project.json / README 首行标题：
#      保留【你的版本】（项目身份，勿被模板覆盖）
#    - src/views/<你的模块>/、src/api/、src/components/ 中你新增的文件：
#      保留【你的版本】；模板同名文件（如示例页）按需取舍
#    - vite/、scripts/、根配置（package.json/pnpm-workspace.yaml 等）：
#      优先采用【模板版本】，再叠加你项目的少量定制
#    - package.json：建议以模板版本为基础，重放你的依赖增删

# 3. 依赖同步与全量验证
pnpm install
pnpm check                          # typecheck + lint + format
pnpm template:validate 2>/dev/null || true   # 衍生项目不适用，忽略失败
pnpm build:dev                      # 构建冒烟（核对身份卡/联邦产物）

# 4. 连平台冒烟（必须）
pnpm dev                            # 登录后抽查核心页面与示例页

# 5. 提交合并
git commit -m "chore: sync template v1.4.0 (Vue 3.5 + Vite 7 toolchain)"
```

## 判断"这次更新与我有关吗"

读模板 `docs/changelog.md` 对应版本：

| 变更类型                          | 是否需要吸收 | 方式                      |
| --------------------------------- | ------------ | ------------------------- |
| 破坏性变更（依赖大版本/机制替换） | 强烈建议     | 完整走上述流程            |
| 新增能力（组件/示例页/工具）      | 按需         | 可只 cherry-pick 相关文件 |
| 修复（bugfix/时序/泄漏类）        | 建议尽快     | cherry-pick 或合并 tag    |
| 文档/CI 样例                      | 随意         | 抄需要的部分              |

## 不建议的做法

- **不要**在衍生项目里直接改模板自带的 `vite/`、`scripts/` 文件后不记录——下次合并必然冲突且难判断归属。有定制需求时：小改动保留并在 README"项目定制"一节登记；大改动拷贝改名（如 `vite/config/server.project.ts`）后引用。
- **不要**跳过连平台冒烟直接合并到主干——工具链类更新（如 v1.4.0 的 Vite 7）必须实测联邦加载。
