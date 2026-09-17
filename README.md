# jh4j-ui-template

> **JH4J Cloud 基于 Vue 3 + Vite + Module Federation 的 PC 业务子系统标准模板。**
> 模板既支持由 `@agile-team/jh4j-cloud-cli` 拉取并非交互初始化，也支持直接 `git clone` 后运行内置初始化命令；两种方式使用同一份配置契约。

---

## 目录导航

- [快速开始](#快速开始)
- [基于模板创建新业务系统](#基于模板创建新业务系统)
- [开发模式说明](#开发模式说明)
- [项目目录结构](#项目目录结构)
- [技术栈](#技术栈)
- [Module Federation 架构](#module-federation-架构)
- [代码组织规范](#代码组织规范)
- [UI 规范（wl-skills-ui）](#ui-规范wl-skills-ui)
- [质量保障](#质量保障)
- [常用开发模式](#常用开发模式)
- [环境配置](#环境配置)
- [版本对齐](#版本对齐)
- [常见问题](#常见问题)
- [更新记录](#更新记录)

---

## 快速开始

运行环境：Node.js 24（推荐），兼容 Node.js 22 LTS；包管理器固定为 pnpm 11.8+。

### 1. 初始化项目

直接 clone 模板时，先运行零依赖初始化脚本。每个问题都带有安全的 JH4J 默认值，直接回车即可确认：

```bash
pnpm setup
```

脚手架或 CI 可使用非交互模式：

```bash
pnpm setup -- --yes --config ./project-input.json --created-by @agile-team/jh4j-cloud-cli@0.3.0
```

默认启用完整的 `@robot-admin/git-standards`，包含 Commitizen、Commitlint、Husky、ESLint、Prettier 和 lint-staged。直接 clone 时如明确不需要，可执行：

```bash
pnpm setup -- --yes --no-standards
```

禁用该能力会同时移除对应配置、开发依赖和模板 lockfile；随后执行 `pnpm install` 会按精简后的 `package.json` 生成新的 lockfile。

初始化只修改结构化配置、项目名称、业务目录和 `.jhlc/project.json`，不会修改业务代码。

### 2. 安装依赖

```bash
pnpm install
```

> 首次安装前请确认 `.npmrc` 中的内部 npm 源可访问（默认 `npm.walsin.com.cn`，`@jhlc` / `@agile-team` scope 同源）。模板包含 `element-plus` 企业定制版本等非 scope 包，不能只把 scope 指向内部源。安装完成后 `postinstall` 会自动修补 `@jhlc/common-core` 的类型声明。

### 3. 启动开发服务器

```bash
# 连接远程 public（日常开发，默认）
pnpm dev
```

启动成功后浏览器自动打开 `http://localhost:8001/`，登录后即可看到平台界面。

### 4. 构建打包

```bash
pnpm build          # dev 环境构建
pnpm build:uat      # uat 环境构建
```

---

## 基于模板创建新业务系统

> 不建议复制目录后逐文件查找替换。直接 clone 时运行 `pnpm setup`；通过 JH4J Cloud CLI 创建时，会读取 `template.manifest.json` 并调用同一初始化入口。

### 方式一：直接 clone

```bash
git clone <jh4j-ui-template-repository> my-project
cd my-project
pnpm setup
pnpm install
pnpm dev
```

### 方式二：内部脚手架

```bash
jh4j create my-project
jh4j create my-project --template web.jh4j-mf-remote
jh4j create my-project --yes --no-standards
```

项目级配置统一保存在 `project.config.json`：

| 配置            | 用途                                         |
| --------------- | -------------------------------------------- |
| `projectName`   | npm 项目名称                                 |
| `moduleName`    | 平台模块标识、部署目录及 Federation 页面前缀 |
| `title`         | 浏览器标题和平台运行时标题                   |
| `devServerPort` | 本地开发端口                                 |
| `environments`  | DEV/SIT/UAT/PRE/PRD 地址与 API 前缀          |
| `features`      | 脚手架选中的标准化能力 ID                    |

生成来源和模板版本保存在 `.jhlc/project.json`，业务开发者不应手动修改模板来源字段。

### 创建业务页面

```bash
src/views/xxx/
├── list/
│   ├── index.vue       # 视图层
│   ├── data.ts         # 数据逻辑层
│   └── index.scss      # 样式层
├── form/
└── detail/
```

### 注册页面暴露

在 `vite/plugins/shared/pages.ts` 中注册页面路径：

```ts
import type { SharedPageItem } from "./utils";

export const list: SharedPageItem[] = [
  { name: "xxx/style/index.vue", label: "module style" },
  { name: "xxx/list/index.vue", label: "List" },
  { name: "xxx/form/index.vue", label: "Form" }
];
```

### 创建 API 接口

```ts
// src/api/xxx.ts
import request from "@jhlc/common-core/src/util/request";

export function getListApi(params: any) {
  return request({ url: "/xxx/list", method: "get", params });
}
```

### 启动验证

```bash
pnpm dev
# 浏览器访问 http://localhost:8001/，登录后在菜单中找到对应页面
```

---

## 开发模式说明

本项目提供三种职责互斥的开发模式：

| 场景            | 命令              | 当前模块接口      | public           |
| --------------- | ----------------- | ----------------- | ---------------- |
| 连接远程环境    | `pnpm dev`        | 远程              | 远程             |
| 联调本地后端    | `pnpm dev:local`  | `localhost:10010` | 远程             |
| 联调本地 public | `pnpm dev:public` | 远程              | `localhost:8002` |

五套环境地址统一维护在 `project.config.json`，本机临时覆盖使用不提交的 `.env.local`。完整命令和代理说明见 `docs/local-development.md`。

#### 本地联调前置步骤

```bash
# 终端1：编译 public（首次或 public 有更新时）
cd <platform-public-project> && pnpm build:sit

# 终端2：托管 public 构建产物到 :8002
cd <platform-public-project> && pnpm serve:local

# 终端3：启动业务项目
cd <business-project> && pnpm dev:public
```

> 如需实时监听 public 改动，终端1 改用 `pnpm dev:local`（build --watch）。

---

## 项目目录结构

```
jh4j-ui-template/
├── project.config.json      # 项目唯一可变配置入口
├── template.manifest.json   # 模板标识、版本、运行时和参数契约
├── pnpm-workspace.yaml      # pnpm 11 安装策略与依赖构建白名单
├── .jhlc/project.json       # 初始化后生成的项目来源元数据
├── public/                  # 静态资源
├── scripts/
│   └── setup-project.mjs    # clone 与脚手架共用的初始化入口
├── src/
│   ├── api/                 # 业务接口定义
│   ├── assets/              # 静态资源（样式、图片）
│   │   └── style/           # SCSS 样式
│   ├── components/          # 业务公共组件
│   ├── composables/         # 组合式函数（Hooks）
│   ├── types/               # TypeScript 类型定义
│   │   └── jh4j-cloud.ts    # 平台配置（systemModules 等）
│   ├── util/                # 工具函数
│   │   ├── system.ts        # Module Federation 远程组件加载器
│   │   ├── pages-dev.ts     # 开发环境本地页面优先加载
│   │   └── jh4j.ts          # 运行时环境读取
│   ├── views/               # 业务页面
│   │   └── template/demo/   # 示例页面（可删除）
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口文件
│   ├── main-core.ts         # 核心初始化（Pinia、Router、i18n、Platform）
│   └── env.d.ts             # 全局类型声明（Federation 远程模块等）
├── vite/
│   ├── config/              # 分层 Vite 工程配置
│   │   ├── app.ts           # 读取 project.config.json
│   │   ├── environments.ts  # 读取五套环境配置
│   │   ├── context.ts       # 模式解析与运行时配置
│   │   ├── server.ts        # 开发服务器与代理
│   │   ├── plugins.ts       # 插件组合
│   │   ├── base.ts          # 通用 Vite 配置
│   │   └── build.ts         # 构建配置
│   ├── plugins/             # Vite 插件配置
│   │   ├── index.ts         # 插件聚合（federation、SVG 等）
│   │   ├── gen-env-json.ts  # 构建产物 env.json 身份卡生成
│   │   ├── shared/          # Federation exposes 配置
│   │   │   ├── components.ts # 暴露的公共组件
│   │   │   └── pages.ts     # 暴露的业务页面
│   │   └── type.ts          # PluginOption 类型定义
│   └── build-environment-guard.ts # 发布环境防串线闸门（分支与 --mode 一致性）
├── vite.config.ts           # 精简 Vite 入口
├── tsconfig.json            # TypeScript 配置
├── .env                     # 各环境共用配置
├── .env.local.example       # 本机覆盖配置样例（复制为 .env.local）
└── package.json
```

---

## 技术栈

| 分类     | 技术                             | 版本          | 说明                               |
| -------- | -------------------------------- | ------------- | ---------------------------------- |
| 框架     | Vue 3                            | ~3.2.25       | Composition API + `<script setup>` |
| 构建     | Vite                             | 4.4.9         | 开发 HMR + 构建                    |
| 微前端   | @originjs/vite-plugin-federation | 1.4.1-jh.3    | Module Federation                  |
| 状态管理 | Pinia                            | ~2.0.14       | 通过 federation 共享远程实例       |
| 路由     | Vue Router                       | 4.4.3         | 通过 federation 共享远程实例       |
| UI 组件  | Element Plus                     | 2.2.6-prod.3  | 企业级 UI                          |
| UI 规范  | @agile-team/wl-skills-ui         | ^1.11.1       | 设计令牌/组件皮肤/列渲染运行时     |
| 国际化   | Vue I18n                         | 9.13.1        | 通过 federation 共享远程实例       |
| 公共包   | @jhlc/common-core                | 3.1.0-prod.14 | 平台共享 Store/API/类型            |
| 语言     | TypeScript                       | ^5.4.0        | 类型安全                           |

---

## Module Federation 架构

```
┌──────────────────────────────────────────────────────┐
│                    浏览器 :8001                        │
│  jh4j-ui-template（Host / 业务子应用）                  │
│                                                      │
│  静态 import（federation "main" remote）：              │
│    ├── store       → main/store/index.ts              │
│    ├── VueI18n     → main/language/index.ts           │
│    ├── permission  → main/permission.ts               │
│    └── initPlatform→ main/init-platform               │
│                                                      │
│  动态 fetchRemoteComponent（"public" remote）：         │
│    ├── plugins     → public./plugins/index.ts         │
│    ├── router      → public./router/index.ts          │
│    └── layout      → public./layout/index.vue         │
│                                                      │
│  共享依赖（federation shared）：                        │
│    vue / pinia / vue-router / element-plus            │
│    @jhlc/common-core / @vueuse/core                   │
└──────────────┬───────────────────────────┬────────────┘
               │                           │
    ┌──────────▼──────────┐    ┌───────────▼───────────┐
    │ /assets/remoteEntry │    │ /sub/public/assets/    │
    │   （完整版 main）     │    │  remoteEntry（增量版）  │
    │ store/language/      │    │ plugins/router/layout  │
    │ permission/platform  │    │                       │
    └─────────────────────┘    └───────────────────────┘
```

### 关键设计

- **store / VueI18n / permission**：使用静态 `import from "main/..."` 从完整版 remoteEntry 加载，确保 Pinia 实例正确共享
- **plugins / router / layout**：使用动态 `fetchRemoteComponent("public", ...)` 从增量版 remoteEntry 加载
- **optimizeDeps.exclude**：`pinia` 和 `vue-router` 必须排除在 Vite 预打包之外，避免产生独立副本与 federation 共享实例冲突

---

## 代码组织规范

### 三文件分离（推荐）

每个页面推荐拆分为三个文件，职责清晰：

```
views/xxx/list/
├── index.vue       # 视图层：模板 + 组件引用，不含业务逻辑
├── data.ts         # 数据层：API 调用 + 响应式数据 + 事件处理
└── index.scss      # 样式层：scoped SCSS
```

**index.vue**（视图层）：

```vue
<template>
  <div class="xxx-list">
    <el-table :data="tableData" v-loading="loading">
      <!-- 表格列 -->
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { createPage } from "./data";
const { tableData, loading, handleSearch, handleReset } = createPage();
</script>

<style lang="scss" scoped src="./index.scss" />
```

**data.ts**（数据层）：

```ts
import { ref, onMounted } from "vue";
import { getListApi } from "@/api/xxx";

export function createPage() {
  const tableData = ref([]);
  const loading = ref(false);

  async function handleSearch() {
    loading.value = true;
    try {
      const res = await getListApi({});
      tableData.value = res.rows || [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => handleSearch());

  return { tableData, loading, handleSearch };
}
```

### 命名规范

| 类型      | 规范             | 示例                          |
| --------- | ---------------- | ----------------------------- |
| 文件名    | kebab-case       | `order-list.vue`              |
| 组件名    | PascalCase       | `OrderList`                   |
| 变量/函数 | camelCase        | `orderList`、`handleSearch`   |
| 常量      | UPPER_SNAKE_CASE | `API_CONFIG`                  |
| 类型/接口 | PascalCase       | `OrderItem`                   |
| CSS 类名  | BEM              | `.order-list__header--active` |

### 样式规范

- 视觉基线（间距/圆角/配色/组件皮肤）由 `@agile-team/wl-skills-ui/styles` 全局提供，业务代码不重复实现
- 颜色一律使用 Element Plus / wl-skills-ui 的 CSS 变量：`color: var(--el-color-primary)`，禁止硬编码历史色值
- 自定义样式使用 `<style scoped>`，避免全局污染；全局覆盖优先沉淀到 `src/assets/style/`
- 不使用原子化 CSS（WindiCSS 已于本版本移除，等效 preflight 见 `src/assets/style/main.scss` 顶部说明）

---

## UI 规范（wl-skills-ui）

模板已默认接入团队 UI 统一规范体系，新项目无需手工集成：

| 层                   | 接入点                                                                          | 作用                                                                       |
| -------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| L0 设计令牌          | `index.html` 引入 `wl-skills-ui/design/tokens/base.css`                         | 品牌色/间距/圆角最先加载                                                   |
| L1-L3 组件皮肤与骨架 | `src/assets/style/main.scss` 首行 `@use "@agile-team/wl-skills-ui/styles" as *` | Element Plus、封装组件、list-page/detail-page 等布局骨架                   |
| 运行时渲染预设       | `src/main-core.ts` 调用 `installCommonPreset()`                                 | 状态/分类/编号字段经 `defineColumns()` 自动渲染 Tag/徽标                   |
| 示例页               | `src/views/template/demo/`                                                      | 列表页 + 详情页的标准写法示范（defineColumns + renderOps + renderTagNode） |

补充说明：

- 列定义统一用 `defineColumns()` 包裹，操作列用 `renderOps()`，状态字段用 `renderTagNode()`（导入自 `@agile-team/wl-skills-ui/runtime`）
- AI 编码规范文件（AGENTS.md 等）由 wl-skills-ui 自动生成与增量更新，安装命令参见《前端编码规范落地宣贯文档（多项目集群管控方案）》附录 A
- 风格审计：`npx wl-ui all --project . --outFile report.md`（只读扫描，不修改文件）

---

## 质量保障

| 命令                                | 时机                  | 说明                                               |
| ----------------------------------- | --------------------- | -------------------------------------------------- |
| `pnpm check`                        | 手动 / CI             | typecheck + lint + format:check 一键全检           |
| `pnpm typecheck`                    | pre-push 钩子自动执行 | 见下方"类型检查口径"说明                           |
| `pnpm lint` / `pnpm lint:fix`       | 随时                  | ESLint 检查 / 自动修复                             |
| `pnpm format` / `pnpm format:check` | 随时                  | Prettier 格式化 / 校验                             |
| `pnpm template:validate`            | 模板维护时            | 模板契约自检（版本一致性、环境配置、客户标识扫描） |

### 类型检查口径

平台依赖 `@jhlc/common-core` 以 TS 源码形式发包，业务侧深路径引用会把平台源码拉进编译图并产生平台侧类型错误（生产项目实测同此结论）。因此 `pnpm typecheck`（`scripts/typecheck.mjs`）只对本仓库 `src/`、`vite/` 内的错误失败退出；`node_modules` 内的平台错误计数汇总后豁免。平台包发布编译产物后可移除该包装恢复裸 `vue-tsc`。

### 构建防串线

`vite/build-environment-guard.ts` 在构建前校验：标准环境分支（dev/sit/uat/pre/prd）上，`--mode` 必须与分支一致，不一致直接终止构建；功能分支仅打印构建目标提示。防止"SIT 包打到 PRD"类事故。

### 构建产物身份卡

每次构建会在 `dist/env.json` 生成部署溯源信息（`vite/plugins/gen-env-json.ts`）：应用标识、构建环境、commit、分支、流水线号、构建时间、工作区是否干净。部署后访问 `/sub/{module}/env.json` 即可核对部署身份。该文件纯展示，运行时零读取。

---

## 常用开发模式

### API 调用

```ts
import request from "@jhlc/common-core/src/util/request";
// 或使用封装
import { getAction, postAction } from "@jhlc/common-core/src/util/request";
```

### 权限控制

```vue
<!-- 使用 $auth 全局属性 -->
<el-button v-if="$auth.hasPermi('xxx:order:add')">新增</el-button>
```

### 页签操作

```ts
// 关闭当前页签
proxy.$tab.closePage();
// 刷新当前页签
proxy.$tab.refreshPage();
```

### Store 访问

```ts
import useUserStore from "@jhlc/common-core/src/store/user";
import envConfig from "@jhlc/common-core/src/store/env-config";

const user = useUserStore();
console.log(user.name, user.roles);
```

---

## 环境配置

### 配置职责

| 文件                          | 用途                                 |
| ----------------------------- | ------------------------------------ |
| `project.config.json`         | 项目标识、标题、端口、五套环境默认值 |
| `.env`                        | 无敏感信息的跨环境运行时默认值       |
| `.env.local`                  | 本机地址、报表密钥等临时覆盖，不提交 |
| `.env.local.example`          | `.env.local` 的键位说明样例          |
| `vite/config/environments.ts` | 只负责读取结构化环境配置             |
| `vite/config/app.ts`          | 只负责读取项目和本地联调配置         |

### 服务地址配置

```json
{
  "sit": {
    "webUrl": "https://sit.example.internal",
    "apiPrefix": "sit-api"
  }
}
```

配置支持完整域名或 `http://IP:端口`。Vite 会统一生成 `baseApi`、`webUrl`、`runtimeEnv` 和代理规则，构建产物默认部署到 `/sub/{module}/`。

---

## 版本对齐

> 以下依赖版本必须与目标平台的 public 工程保持一致，版本不对齐会导致 federation 共享失败。

| 包                               | 版本          | 说明                            |
| -------------------------------- | ------------- | ------------------------------- |
| vue                              | ~3.2.25       | 核心框架                        |
| pinia                            | ~2.0.14       | 状态管理（federation shared）   |
| vue-router                       | 4.4.3         | 路由（federation shared）       |
| element-plus                     | 2.2.6-prod.3  | UI 组件（federation shared）    |
| @jhlc/common-core                | 3.1.0-prod.14 | 平台共享包（federation shared） |
| @originjs/vite-plugin-federation | 1.4.1-jh.3    | 微前端插件                      |
| vite                             | 4.4.9         | 构建工具                        |
| typescript                       | ^5.4.0        | 类型检查                        |

---

## 常见问题

### 白屏 / remoteEntry.js 404

**原因**：远程服务器不可达，或 proxy 配置错误。
**排查**：检查 `project.config.json` 中目标环境的 `webUrl` 是否可访问，并核对 `server.ts` 代理配置。

### "getActivePinia()" 错误

**原因**：`pinia` 被 Vite 预打包到独立 chunk，产生双实例。
**解法**：确保 `vite.config.ts` 中 `optimizeDeps.exclude` 包含 `"pinia"` 和 `"vue-router"`。

### 本地联调 public 改了代码没生效

**原因**：浏览器缓存了旧 remoteEntry.js。
**解法**：DevTools → Network → 勾选 `Disable cache`，再刷新。或 Ctrl+F5 强刷。

### systemApp / agGridApp 加载失败

这两个远程模块由远程服务器提供，本地一般不启动。确认当前目标环境的远程服务地址可访问。

### 新增页面后菜单看不到

页面注册后需要后台配置菜单路由。联系管理员在系统管理中添加对应菜单项。

### BaseQuery / BaseTable / jh-pagination 从哪里来

这些平台组件由 public 工程的 `plugins/index.ts` 在运行时全局注册，业务页面直接在模板中使用，无需 import（示例页 `src/views/template/demo/list/index.vue` 即此写法）。

### 构建被 [env-guard] 拦截

当前分支是标准环境分支（dev/sit/uat/pre/prd）时，只能构建同环境的包。切换到对应环境执行 `pnpm build:{env}`，或在正确的分支上构建。

### 为什么没有 WindiCSS / 原子化 CSS

模板曾内置 WindiCSS，但经全量扫描确认业务页面无原子类消费方，safe-list 生成数千死类 CSS，已于 v1.2.0 移除。等效的 preflight 样式重置保留在 `src/assets/style/main.scss` 顶部，视觉零变化。

---

## 更新记录

见 [docs/changelog.md](docs/changelog.md)：每个版本的特性回移说明、破坏性变更与后续升级路线（env.json 运行时接管、E2E 测试基建、wl-skills-kit 特性化接入等）。
