# 更新记录

## v1.4.0（2026-10-01）

工具链大版本升级，对齐 wl-ui-produce `08a83c3e`（build(steelmaking): align Vue 3.5 and Vite 7 toolchain）。**升级基线标记：`git tag v1.3.0`（Vue 3.2 / Vite 4 末版）**。

### 破坏性变更

- **Vue ~3.2.25 → 3.5.40**（+ @vue/compiler-sfc 同版）；**Vite 4.4.9 → 7.3.6**（@vitejs/plugin-vue → 6.0.8、unplugin-auto-import → 20.3.0、unplugin-vue-components → 29.2.0）
- **联邦插件从 jh 定制 fork（1.4.1-jh.3）切换到上游 `@originjs/vite-plugin-federation@1.4.1`**；`@jhlc/common-vite-plugin` 退役
- **移除 `vite-plugin-top-level-await`**（ES2022 原生支持 TLA，`build.target: "es2022"` + `modulePreload.polyfill: false`，@swc/core 构建白名单同步移除）
- **移除 `vite-plugin-svg-icons`**（停在 2023 年未适配 Vite 7）：新增自研 `vite/plugins/svg-icons-register.ts` 保留 `virtual:svg-icons-register` 契约与 `icon-[dir]-[name]` symbolId 规则，真实读取 `src/assets/icons/svg` 生成雪碧图（produce 无图标用空存根，模板按有图标实现）
- **移除 `@vitejs/plugin-vue-jsx`**（全库零 jsx/tsx 消费）

### 新增/替代

- `vite/plugins/build-artifacts.ts`（自 produce 移植）：承担原 common-vite-plugin 的 version.js 协议产物 + 简繁双产物（opencc-js，仅构建时加载字典；业务 chunk 转换、框架 chunk 引用改写的边界保持一致）
- `vite/plugins/full-import.ts` 重写：退役 esbuild+vm 沙箱方案，改由 Vite 7 config 加载链原生编译 TS 页面清单，transform 注入 pages-dev
- `scripts/enforce-pnpm.mjs` 替代 `npx only-allow pnpm`
- `vendor/xlsx-0.20.3.tgz` 本地冻结依赖（SHA-256 与 produce 记录一致：8DC73FC3…BB99FE8），解决 SheetJS 官方 CDN 地址在私服不可达问题
- pnpm-workspace 覆盖安全回溯线（nanoid/lodash/js-cookie/@babel/core）并与 public/produce 三方一致

### 性能（对齐 produce 已验证参数）

- `css.preprocessorMaxWorkers: 1`（复用常驻 Sass 编译器）
- `resolve.dedupe: [pinia, vue, vue-router, element-plus]`（防宿主实例分裂）
- `optimizeDeps.holdUntilCrawlEnd: false`（浏览器与优化器并行）
- dev 版本标签固定为 `"dev"`（避免每进程时间戳击穿 Vite 依赖缓存），构建仍用发布时间戳

### 版本与契约

- engines：node `^20.19.0 || >=22.12.0`（Vite 7 要求，与 produce 一致；.nvmrc 保持 24）
- **wl-skills-ui `1.11.1` → `^1.13.0`**（1.13 兼容承诺：未声明 profile 走宽松口径，升级零行为变化）
- axios 0.27.2 → 0.33.0；@types/node 22.20.1
- 保留：env.json 运行时接管、身份卡、ENV_LOCAL_API 前缀路由、token 时序等 v1.3.0 全部能力

## v1.3.0（2026-09-30）

### 环境管控：env.json 运行时接管（子应用集成）

按《子应用环境管控规范（以 public 的 env.json 为准）》完成五步集成，**门禁卡控由 wl-ui-public 中心化承担，子应用只做集成**：

- 新增 `src/util/public-env.ts`：生产构建预载 `/sub/public/env.json`（5s 超时兜底）
- `src/main.ts`：`await publicEnvReady` 后动态加载 `main-core`
- `vite/config/base.ts`：`process.env` define 运行时化（构建兜底 + env.json 深合并，错误 mode 打包也会被运行时拉正）
- 退役 `/env-dev.json`（含 `serve-runtime-env-json` dev 中间件）
- **移除 v1.2.0 的本地构建闸门 `vite/build-environment-guard.ts`**：串线防控统一由 public 侧闸门 + env.json 运行时接管承担，子应用不再重复设卡

### 本地联调：ENV_LOCAL_API 前缀级多服务接管

- `vite/config/context.ts` + `server.ts`：支持 `pl=http://localhost:10301;pb=http://localhost:10205` 按网关前缀把不同微服务路由到不同本地进程（前缀长者优先、严格校验、去 Authorization 头）
- 裸 URL 写法等价 v1.2 的单服务全接管；`project.config.json` 的 `localBackendRoutes` 字段废弃移除

### wl-skills-kit 钩子联动

- `.husky/pre-push` 升级为 kit 感知版：安装 `@agile-team/wl-skills-kit` 后自动走 `wl-skills validate --typecheck`（R14 + 规范检测），未安装时优雅降级为 `pnpm typecheck`

### AI 规范矩阵与工程配套

- `wl-ui init --mode native --editor all` 生成完整规范矩阵：`AGENTS.md`（托管路由）+ 9 编辑器规则（copilot/cursor/windsurf/kiro/trae/claude-code/cline/agents-generic/qoder）+ `.github/wl-skills-ui/` 触发提示 + `.wl-skills-ui-manifest.json`（`npx wl-ui update` 增量维护）
- 新增 `.mcp.json`（wl-skills-ui MCP server）与 `.cspell.json`（轻量拼写检查）
- `src/main.ts` 增加 `@agile-team/wl-skills-ui/runtime/auto` 运行时守卫
- wl-skills-ui 版本钉死 `1.11.1` 与生产项目对齐（1.12 的 profile 体系尚无 native+jh+联邦AG 混合形态，待上游补充后升级，见路线图）

### 组件样板（自生产项目移植并泛化）

- `C_TagStatus`：配置驱动状态标签，业务字典统一经 `registerStatusConfig()` 注册（内置 boolean/enable 通用字典，业务示例字典已泛化移除）
- `C_Tree`：通用树（Tab + 过滤 + 插槽）；`C_ReportPreview`：打印报表平台远程预览
- `c_formModal`：三态表单弹窗（add/edit/view + 列表选择器 + 测试填充，steelmaking 命名已泛化为 c-form-modal）
- `c_listModal` / `c_formSections` / `c_spliterTitle`

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

1. **E2E 测试基建**：预置 Playwright 最小骨架（auth-setup + 只读示例），或作为 feature 接入 `@agile-team/wl-skills-test`。
2. **wl-skills-ui 1.12+ profile 升级**：待上游提供"native + jh 封装 + 联邦 AG Grid"混合 profile 后，从钉死的 1.11.1 升级并切换 preset 口径。
3. **wl-skills-kit 特性化**：将编码规范体系（validate 卡门、页面生成、API 契约同步工具链）做成 `template.manifest.json` 的可选 feature，`pnpm setup` 时选择启用。
4. **api.md 契约工具链**：模板当前为静态格式示范，接入 kit 后由脚本单向生成 + 构建卡门校验漂移。
5. **平台包类型产物**：推动 common-core 发布编译产物（d.ts），随后移除 `scripts/typecheck.mjs` 包装恢复裸 vue-tsc 全量卡门。
6. **左树右表 / Tab 工作台示例页**：补充 tree-list、tab-workbench 两种高频页面形态的可运行示范。
7. **CI 样例**：Jenkinsfile / GitHub Actions 模板与流水线命令文档化。
