# jh4j-ui-template

> **JH4J Cloud 基于 Vue 3 + Vite + Module Federation 的 PC 业务子系统标准模板。**
> 支持两种创建路径：内部脚手架 `@agile-team/jh4j-cloud-cli` 拉取并非交互初始化，或直接 `git clone` 后运行内置 `pnpm setup`；两种方式使用同一份配置契约。

---

## 按任务快速导航

| 你想做什么                                 | 直接看                        |
| ------------------------------------------ | ----------------------------- |
| 3 分钟把模板跑起来（先跑通再说）           | [§1](#1-三分钟跑起来)         |
| 基于模板创建我的实际项目（正式流程）       | [§2](#2-基于模板创建实际项目) |
| 写第一个业务页面（照抄即合规）             | [§3](#3-写第一个业务页面)     |
| 日常开发：联调后端 / 用平台能力 / 质量检查 | [§4](#4-日常开发)             |
| 构建与发布                                 | [§5](#5-构建与发布)           |
| 深入了解：架构 / 规范 / 环境体系           | [§6](#6-参考手册)             |

---

## 1. 三分钟跑起来

**环境要求**：Node.js 22.12+（推荐 24，见 `.nvmrc`）；包管理器固定 pnpm 11.8+；能访问内部 npm 源 `npm.walsin.com.cn`。

```bash
git clone <template-repository> my-app   # 或直接下载
cd my-app
pnpm setup        # 零依赖初始化：项目名/模块名/标题/端口/五套环境，全部有安全默认值，回车即可
pnpm install      # 内网源安装；postinstall 自动修补 common-core 类型声明
pnpm dev          # 连接远程 public 启动，自动打开 http://localhost:8001/
```

启动后登录即可看到平台界面与示例页面（示例订单列表 / 订单详情）。

**首次失败速查**：

| 症状                                | 处置                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| install 报 ENOTFOUND / fetch failed | 内网源不可达：确认 VPN/内网，`.npmrc` 指向 `npm.walsin.com.cn`（`@jhlc`、`@agile-team` scope 同源） |
| 白屏 / remoteEntry 404              | 目标环境远程服务不可达：核对 `project.config.json` 中该环境 `webUrl`                                |
| 端口占用                            | 修改 `project.config.json` 的 `devServerPort` 后重启                                                |

---

## 2. 基于模板创建实际项目

> 不要复制目录后逐文件查找替换——用 `pnpm setup`，它只改结构化配置、项目名、业务目录和 `.jhlc/project.json` 元数据，不动业务代码。

### 2.1 两种创建方式

```bash
# 方式一：内部脚手架（推荐，读取 template.manifest.json 走同一初始化入口）
jh4j create my-project
jh4j create my-project --template web.jh4j-mf-remote
jh4j create my-project --yes --no-standards

# 方式二：直接 clone
git clone <template-repository> my-project
cd my-project
pnpm setup                              # 交互式；CI 用 --yes --config ./project-input.json
pnpm install && pnpm dev
```

`pnpm setup` 关键参数：`--project-name`（npm 包名）、`--module`（平台模块标识 = 部署目录 = Federation 前缀，决定 `src/views/<module>/`）、`--title`、`--port`、`--{env}-url/--{env}-api-prefix`（五套环境逐项确认）、`--no-standards`（拆除 git 规范全家桶）、`--config <json>`（非交互全量输入）。

### 2.2 项目唯一配置入口：project.config.json

| 配置                                   | 用途                                   | 何时改                   |
| -------------------------------------- | -------------------------------------- | ------------------------ |
| `projectName` / `moduleName` / `title` | 包名 / 平台模块标识 / 标题             | setup 时定，之后基本不动 |
| `devServerPort`                        | 本地端口                               | 冲突时                   |
| `environments{dev,sit,uat,pre,prd}`    | 每套环境 `webUrl` + `apiPrefix`        | 后端地址变化时           |
| `features`                             | 启用的标准化能力（如 `git-standards`） | 需要增减能力时           |

模板来源与版本存于 `.jhlc/project.json`（生成物，勿手改）。本机临时覆盖（不改此文件）用 `.env.local`，键位见 `.env.local.example`。

### 2.3 git 规范能力（默认开启）

默认启用 `@robot-admin/git-standards`：Commitizen（`pnpm cz`）、Commitlint、Husky（pre-commit lint-staged / pre-push typecheck）、ESLint、Prettier。不需要可 `pnpm setup -- --no-standards` 整体拆除（check 降级为仅 typecheck）。

---

## 3. 写第一个业务页面

> **照抄示例页就是合规写法**。示例页 `src/views/<module>/demo/` 是完整可运行参考（本地数据，无需后端）：
>
> - `demo/list`——标准列表页（查询 + 工具栏 + BaseTable/AG Grid + 三态弹窗 + 详情抽屉）
> - `demo/tree-list`——左树右表（C_Tree + 拖拽分割条 + 点击节点过滤右表）
> - `demo/detail`——只读详情页（el-descriptions 骨架）

### 3.1 三文件分离（页面标准结构）

```
src/views/<module>/order/list/
├── index.vue     # 视图层：模板 + 组件引用，不含业务逻辑
├── data.ts       # 数据层：列定义(defineColumns) + 状态 + 事件处理
└── index.scss    # 样式层：scoped SCSS（骨架样式已由 wl-skills-ui 提供）
```

从 `demo/list` 复制三文件开始改。核心规范在示例页中都有活样例：

- 列定义用 `defineColumns([...])` 包裹；状态列 `renderTagNode(v, MAP)`；操作列 `renderOps([...])`
- 骨架类名：`.list-page__query/__toolbar/__title/__table/__pagination`（详情页 `.detail-page`）
- 平台组件 `BaseQuery / BaseToolbar / BaseTable / jh-pagination` 无需 import（public 运行时全局注册）
- 页面级 API 契约格式见 `demo/list/api.md`

### 3.2 注册页面暴露（关键，漏了菜单配了也看不到）

```ts
// vite/plugins/shared/pages.ts
export const list: SharedPageItem[] = [
  { name: "<module>/style/index.vue", label: "module style" },
  { name: "<module>/order/list/index.vue", label: "订单列表" }
];
```

### 3.3 写 API

```ts
// src/api/order.ts
import request from "@jhlc/common-core/src/util/request";

export function getOrderPageApi(params: any) {
  return request({
    url: "/<module>/order/queryPage",
    method: "post",
    data: params
  });
}
```

### 3.4 菜单配置

页面注册后需平台管理员在系统管理中为页面路径配置菜单项，之后菜单可见。

### 3.5 示例页何时删、怎么删

示例页保留到项目上线前均可（零成本，且是新页面的活参考）。正式上线时移除：

1. 删除 `src/views/<module>/demo/` 目录（list / tree-list / detail）
2. 清理 `vite/plugins/shared/pages.ts` 中 demo 条目（保留 module style 条目）
3. 全局搜索 `demo` 确认无残留引用（类型可继续复用 `src/types/page.ts`）

### 3.6 内置组件样板（直接用，自动注册）| 组件 | 位置 | 用途 |

| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `C_ParentView` | `src/components/global/` | 路由父级占位（`<router-view />`） |
| `C_TagStatus` | `src/components/global/` | 配置驱动状态标签；业务字典经 `registerStatusConfig("yourKey", [...])` 注册，内置 boolean/enable 字典 |
| `C_Tree` | `src/components/global/` | 通用树（Tab 切换 + 关键词过滤 + 插槽） |
| `C_ReportPreview` | `src/components/global/` | 打印报表平台远程预览（联邦加载） |
| `c_formModal` | `src/components/local/` | 三态表单弹窗（add/edit/view + 列表选择器回填 + 测试填充） |
| `c_listModal` | `src/components/local/` | 单选列表选择弹窗 |
| `c_formSections` | `src/components/local/` | 折叠区块表单（长表单分区） |
| `c_spliterTitle` | `src/components/local/` | 分区标题条 |

AI 编码规范（AGENTS.md 等 9 编辑器规则）已内置，AI 助手会自动遵循模板规范写页面。

---

## 4. 日常开发

### 4.1 三种开发模式（互斥，按需选一）

| 场景             | 命令              | 模块接口 | public     |
| ---------------- | ----------------- | -------- | ---------- |
| 日常开发（默认） | `pnpm dev`        | 远程     | 远程       |
| 联调本地后端     | `pnpm dev:local`  | 本地后端 | 远程       |
| 联调本地 public  | `pnpm dev:public` | 远程     | 本地 :8002 |

本地后端多服务分流：`.env.local` 写 `ENV_LOCAL_API=pl=http://localhost:10301;pb=http://localhost:10205`（按网关前缀路由，裸 URL = 单服务全接管）。dev 临时切环境：`pnpm dev -- --target=sit`。完整说明 `docs/local-development.md`。

本地 public 联调前置：

```bash
# 终端1：编译 public（或 dev --watch）
cd <platform-public> && pnpm build:sit
# 终端2：托管产物
cd <platform-public> && pnpm serve:local
# 终端3：业务项目
pnpm dev:public
```

### 4.2 平台常用能力

```ts
// API：request / getAction / postAction
import request, { getAction, postAction } from "@jhlc/common-core/src/util/request";

// 权限（模板中直接用）
<el-button v-if="$auth.hasPermi('xxx:order:add')">新增</el-button>

// 页签
proxy.$tab.closePage();   // 关闭当前页签
proxy.$tab.refreshPage(); // 刷新

// Store（federation 共享实例）
import useUserStore from "@jhlc/common-core/src/store/user";
```

### 4.3 质量检查

| 命令                          | 说明                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `pnpm check`                  | typecheck + lint + format:check 一键全检（CI 用）         |
| `pnpm typecheck`              | pre-push 自动执行；装 wl-skills-kit 后升级为 kit validate |
| `pnpm lint` / `pnpm lint:fix` | ESLint                                                    |
| `npx wl-ui check --project .` | UI 规范接入五项检查                                       |
| `pnpm template:validate`      | 模板契约自检（模板维护用）                                |

> typecheck 口径：平台包以 TS 源码发包，`node_modules` 内平台错误豁免、仅本仓库 `src/`、`vite/` 卡门（详见 §6.6）。

---

## 5. 构建与发布

```bash
pnpm build:dev   # 其余：build:sit / build:uat / build:pre / build:prd
```

- 产物全量清空重建（已退役联邦增量打包——历史曾膨胀 599MB）
- **身份卡**：每次构建生成 `dist/env.json`（commit/分支/流水线/时间/脏标记），部署后访问 `/sub/{module}/env.json` 核对部署身份；纯展示，运行时零读取
- **简繁双产物**：业务 chunk 自动转换 + `-tw` 副本；`version.js` 协议产物随构建生成
- **环境管控**：生产运行时以 wl-ui-public 部署的 `/sub/public/env.json` 为准（`src/util/public-env.ts` 预载 + define 深合并），错误 mode 打包也会被运行时拉正；门禁卡控由 public 中心化承担
- Jenkins 安装建议 `pnpm install --frozen-lockfile --prefer-offline`（勿用 `--force`）；`vendor/xlsx-0.20.3.tgz` 为本地冻结依赖，须随仓库检出

---

## 6. 参考手册

### 6.1 技术栈与版本对齐

> **版本对齐是硬约束**：下表必须与目标平台 public 工程一致，否则 federation 共享失败。

| 包                               | 版本          | 说明                                     |
| -------------------------------- | ------------- | ---------------------------------------- |
| vue                              | 3.5.40        | 核心框架（federation shared）            |
| vite                             | 7.3.6         | 构建工具（2026-10 升级）                 |
| pinia                            | ~2.0.14       | 状态管理（federation shared）            |
| vue-router                       | 4.4.3         | 路由（federation shared）                |
| element-plus                     | 2.2.6-prod.3  | UI 组件（企业定制版，federation shared） |
| @jhlc/common-core                | 3.1.0-prod.14 | 平台共享包（federation shared）          |
| @originjs/vite-plugin-federation | 1.4.1（上游） | 微前端插件（jh fork 已退役）             |
| @agile-team/wl-skills-ui         | ^1.13.0       | UI 统一规范                              |
| typescript                       | ^5.4.0        | 类型检查                                 |

engines：node `^20.19.0 || >=22.12.0`。

### 6.2 Module Federation 架构

```
┌──────────────────────────────────────────────────────┐
│                    浏览器 :8001                        │
│  业务子应用（Host）                                    │
│                                                      │
│  静态 import（"main" remote）：                        │
│    store / VueI18n / permission / initPlatform        │
│                                                      │
│  动态 fetchRemoteComponent（"public" remote）：         │
│    plugins / router / layout                         │
│                                                      │
│  共享依赖（federation shared）：                        │
│    vue / pinia / vue-router / element-plus            │
│    @jhlc/common-core / @vueuse/core                   │
└────────────┬───────────────────────────┬────────────┘
             │                           │
  ┌──────────▼──────────┐    ┌───────────▼───────────┐
  │ /assets/remoteEntry │    │ /sub/public/assets/    │
  │ （完整版 main）       │    │ remoteEntry（增量版）   │
  └─────────────────────┘    └───────────────────────┘
```

关键设计：store/i18n/permission 走静态 import 保证 Pinia 实例共享；plugins/router/layout 动态加载；`optimizeDeps.exclude` 必须包含 `pinia`、`vue-router`（防双实例）。

### 6.3 代码组织规范

**三文件分离**（§3.1）；**命名**：文件 kebab-case / 组件 PascalCase / 变量 camelCase / 常量 UPPER_SNAKE / CSS 类 BEM；**样式**：

- 视觉基线由 `@agile-team/wl-skills-ui/styles` 全局提供，业务不重复实现
- 颜色一律 CSS 变量（`var(--el-color-primary)`），禁止硬编码色值
- 自定义样式 `<style scoped>`；全局覆盖沉淀到 `src/assets/style/`
- 不使用原子化 CSS（WindiCSS 已于 v1.2.0 移除，等效 preflight 在 `main.scss` 顶部）

### 6.4 UI 规范（wl-skills-ui，已默认接入）

| 层             | 接入点                                  | 作用                       |
| -------------- | --------------------------------------- | -------------------------- |
| L0 设计令牌    | `index.html` tokens link                | 品牌色/间距/圆角最先加载   |
| L1-L3 皮肤骨架 | `main.scss` 首行 `@use "…/styles" as *` | EP / 封装组件 / 页面骨架   |
| 运行时预设     | `main-core.ts` `installCommonPreset()`  | 状态/分类/编号字段自动渲染 |
| 运行时守卫     | `main.ts` `runtime/auto`                | 溢出兜底等包级保护         |

列渲染三件套 `defineColumns / renderOps / renderTagNode`（导入自 `@agile-team/wl-skills-ui/runtime`）。审计：`npx wl-ui all --project . --outFile report.md`（只读）。规范矩阵用 `npx wl-ui update` 增量维护，勿手改托管块。

### 6.5 环境配置职责

| 文件                                     | 用途                                              |
| ---------------------------------------- | ------------------------------------------------- |
| `project.config.json`                    | 项目标识、端口、五套环境默认值（唯一事实源）      |
| `.env`                                   | 跨环境非敏感默认值（token 存储介质等）            |
| `.env.local`                             | 本机临时覆盖，不提交（样例 `.env.local.example`） |
| `vite/config/environments.ts` / `app.ts` | 只读取上述配置，不另立事实源                      |

### 6.6 typecheck 口径与已知边界

平台包 `@jhlc/common-core` 以 TS 源码发包，深路径引用会把平台源码拉进编译图（任何直接消费方都无法全量 vue-tsc 通过，生产项目同此结论）。`scripts/typecheck.mjs` 仅对本仓库 `src/`、`vite/` 错误失败退出，`node_modules` 平台错误计数豁免；平台包发布编译产物后可恢复裸 `vue-tsc`。

### 6.7 目录结构

```
jh4j-ui-template/
├── project.config.json      # 项目唯一可变配置入口
├── template.manifest.json   # 模板标识/版本/参数契约（脚手架读取）
├── vendor/xlsx-0.20.3.tgz   # 本地冻结依赖（SheetJS 官方包）
├── scripts/
│   ├── setup-project.mjs    # clone 与脚手架共用初始化入口
│   ├── typecheck.mjs        # typecheck 卡门口径包装
│   └── patch-common-core-dts.mjs  # postinstall 类型修补
├── src/
│   ├── api/                 # 业务接口
│   ├── components/global|local/  # C_/c_ 组件样板（自动注册）
│   ├── composables/         # 组合式函数
│   ├── types/               # page.ts（页面类型重导出）/ jh4j-cloud.ts
│   ├── util/                # system.ts（联邦加载）/ public-env.ts（运行时接管）等
│   ├── views/<module>/      # 业务页面（module = 部署标识）
│   ├── main.ts              # 入口：await publicEnvReady 后加载 main-core
│   └── main-core.ts         # 核心初始化（Pinia/Router/Platform）
├── vite/
│   ├── config/              # base/server/context/plugins/build 分层配置
│   └── plugins/
│       ├── index.ts         # 插件聚合（federation 上游版）
│       ├── build-artifacts.ts    # version.js + 简繁双产物
│       ├── svg-icons-register.ts # SVG 雪碧图（虚拟模块契约）
│       ├── gen-env-json.ts  # dist/env.json 身份卡
│       └── shared/pages.ts  # 页面暴露登记处
└── docs/                    # local-development.md / changelog.md
```

### 6.8 常见问题

| 症状                         | 原因与处置                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| 白屏 / remoteEntry 404       | 远程不可达或代理错：核对环境 `webUrl` 与 `vite/config/server.ts`          |
| "getActivePinia()" 错误      | pinia 被预打包成双实例：`optimizeDeps.exclude` 须含 `pinia`、`vue-router` |
| 本地 public 改动不生效       | 浏览器缓存旧 remoteEntry：Network 勾选 Disable cache 或 Ctrl+F5           |
| systemApp/agGridApp 加载失败 | 远程模块由服务端提供，确认目标环境可访问                                  |
| 新页面菜单看不到             | 先在 `shared/pages.ts` 注册，再请管理员配菜单                             |
| Base 组件从哪来              | public 的 plugins 运行时全局注册，直接用（见示例页）                      |
| 为什么没有 WindiCSS          | v1.2.0 已移除（零消费方 + 数千死类），preflight 等效迁移至 `main.scss`    |

### 6.9 更新记录与模板回流

- 版本特性与破坏性变更：[docs/changelog.md](docs/changelog.md)
- **衍生项目如何吸收模板升级**：[docs/upgrade-guide.md](docs/upgrade-guide.md)（建议创建项目时保留模板远程）
- CI 集成样例：[docs/ci-jenkins.md](docs/ci-jenkins.md) 与 `.github/workflows/ci.yml`
- 升级基线标记：`git tag v1.3.0`（Vue 3.2 / Vite 4 末版）
