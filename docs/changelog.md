# 更新记录

## v1.2.0（2026-09-17）

本版本将生产项目（wl-ui-produce 等）实战沉淀的能力回移到模板，并修复模板自身的存量缺陷。

### 破坏性变更

- **移除 WindiCSS**：删除 `windicss` / `vite-plugin-windicss` 依赖、`windi.config.ts`、`vite/plugins/windi-css/` 目录与 `main.ts` 的虚拟模块引入。等效 preflight 已迁至 `src/assets/style/main.scss` 顶部（逐条提取自原构建产物，视觉零变化）。业务代码如有原子类（如 `p-4`）需改为普通 class。
- **放弃联邦增量打包**：`vite/plugins/index.ts` 不再调用 `federationIncreaseOption`，`build.emptyOutDir` 由 `false` 改为 `true`（全量构建、dist 清空重建）。生产项目实测增量机制导致产物膨胀到 18,259 文件/599MB。
- **registry 切换**：内网 npm 源由 `http://172.18.248.130/`（已不可达）切换为 `https://npm.walsin.com.cn/`，并新增 `@agile-team` scope 映射（wl-skills-ui 等团队包同源发布）。

### 新增

- **wl-skills-ui 全量接入**：`index.html` 引入 L0 设计令牌、`main.scss` 引入 L1-L3 组件皮肤、`main-core.ts` 调用 `installCommonPreset()`；新增依赖 `@agile-team/wl-skills-ui`。
- **子应用身份卡**：`vite/plugins/gen-env-json.ts`，构建产物生成 `dist/env.json` 部署溯源（commit/分支/流水线/时间/脏标记），自 wl-ui-produce 移植。
- **发布环境防串线闸门**：`vite/build-environment-guard.ts`，标准环境分支上 `--mode` 与分支不一致直接终止构建，防"SIT 包打到 PRD"类事故。
- **可运行的标准示例页**：`src/views/template/demo/list`（list-page 骨架 + BaseTable(AG Grid) + defineColumns + renderOps + renderTagNode + 本地 CRUD，含 api.md 契约格式示范）与 `demo/detail`（detail-page 骨架）。
- **`C_ParentView` 组件**：路由父级占位（`<router-view />`），布局菜单常用。
- **`.husky/pre-push`**：push 前自动执行 `pnpm typecheck`。
- **`.env.local.example`**：本机覆盖配置的键位样例。
- **`docs/changelog.md`**：本文件。

### 修复

- **token 存储时序**：`main-core.ts` 中 `VUE_APP_TOKEN_LOCALSTORAGE` 判定提前到请求实例与 router 初始化之前——路由守卫首次导航即读取 token，原时序会导致整页刷新时误按 Cookie 查找（自 wl-ui-produce 回移的 bug fix）。
- **typecheck 口径落地**：平台包以 TS 源码发包导致裸 `vue-tsc` 必然失败（v1.1.0 即如此，生产项目实测同结论）。新增 `scripts/typecheck.mjs`：仅对本仓库 `src/`、`vite/` 错误失败退出，`node_modules` 平台错误计数豁免。
- **`vite/config/base.ts` optimizeDeps 深路径预登记**：预先登记 common-core 全部深路径引用，避免运行中触发 re-optimize 整页 reload（生产项目曾实测首开 120s+）。
- **`vite/util/read-code-list.ts` 死代码清理**（已被 vm 沙箱方案取代）、空 `mock/` 目录移除。
- **格式化基线**：仓库内既有文件按 `.prettierrc` 统一格式化，`pnpm format:check` 恢复可用。

### 契约同步

- `package.json` / `template.manifest.json` 版本同步升至 1.2.0；`scripts/setup-project.mjs` 生成的 `.npmrc` 追加 `@agile-team` scope；`scripts/validate-template.mjs` 新增基础设施域名白名单（内部 Nexus 宿主名不计入客户专属标识扫描）。

## 升级路线（后续版本）

按优先级排期，均不阻塞当前版本使用：

1. **env.json 运行时环境接管**：按《子应用环境管控规范（以 public 的 env.json 为准）》五步接入（`src/util/public-env.ts` + define 运行时化 + request TLA），退役 `/env-dev.json`。模板作为新项目源头应率先落地。
2. **ENV_LOCAL_API 前缀级本地接管**：支持 `pl=http://localhost:10301;pb=http://localhost:10205` 多本地服务按网关前缀路由（wl-ui-produce `vite/config/context.ts` 已实现，待回移）。
3. **E2E 测试基建**：预置 Playwright 最小骨架（auth-setup + 只读示例），或作为 feature 接入 `@agile-team/wl-skills-test`。
4. **wl-skills-kit 特性化**：将编码规范体系（validate 卡门、页面生成、API 契约同步）做成 `template.manifest.json` 的可选 feature，`pnpm setup` 时选择启用。
5. **平台包类型产物**：推动 common-core 发布编译产物（d.ts），随后移除 `scripts/typecheck.mjs` 包装恢复裸 vue-tsc 全量卡门。
