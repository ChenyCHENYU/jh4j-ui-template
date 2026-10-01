# 本地开发与环境配置

## 三种开发方式

| 场景             | 命令              | public 来源             | 当前模块服务             |
| ---------------- | ----------------- | ----------------------- | ------------------------ |
| 本地连接目标环境 | `pnpm dev`        | `project.config.json`   | `project.config.json`    |
| 本地连接本地后端 | `pnpm dev:local`  | 目标环境                | `http://localhost:10010` |
| 本地联调 public  | `pnpm dev:public` | `http://localhost:8002` | 目标环境                 |

三种方式互斥。`dev:local` 只切换当前模块接口，登录、用户、菜单和其他公共接口仍访问目标环境；`dev:public` 只切换 public 的静态资源和 Federation 入口。

## 临时切换目标环境

项目的标准目标环境是 `dev`、`sit`、`uat`、`pre`、`prd`，默认地址统一维护在 `project.config.json`。模板初始值使用本地安全地址，创建项目时由使用者或内部脚手架确认实际环境地址。

目标环境解析优先级：`--target` CLI 参数 > `DEV_SERVER_ENV` 环境变量 > vite mode。团队需要统一切环境又不想改脚本时，在 shell 配置或 CI 中设置：

```bash
DEV_SERVER_ENV=sit pnpm dev    # 等价 pnpm dev -- --target=sit
```

`.env` 只保存各环境共用的配置。本机需要临时覆盖目标地址时，可在不提交的 `.env.local` 中设置 `ENV_WEB_URL` 和 `ENV_API_PREFIX`。

需要显式选择其他目标环境时使用 `--target`：

```bash
pnpm dev -- --target=sit
pnpm dev:local -- --target=sit
pnpm dev:public -- --target=sit
```

`--target` 仅支持上述五个值。

## 本地后端多服务分流（dev:local）

本地同时起多个后端微服务时，按网关前缀把请求路由到不同进程（`.env.local`）：

```bash
# 前缀=地址，分号分隔；前缀长者优先匹配
ENV_LOCAL_API=pl=http://localhost:10301;pb=http://localhost:10205

# 裸 URL（不含 "="）= 单服务全接管，等价 project.config.json 的 localBackendUrl
ENV_LOCAL_API=http://localhost:10010
```

规则要点：

- 匹配路径为 `{baseApi}/{prefix}/**`，命中后剥掉前缀转发到本地目标，并移除 `Authorization` 头（本地服务不走平台 OAuth2）
- 前缀必须匹配 `^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*$`；地址只接受不带凭据/查询/锚点的 http(s)
- 重复前缀、非法条目会在启动时直接报错，不会静默错路由

## public 本地联调

需要联调本地 public 时：

```bash
# 平台 public 工程，终端 1
pnpm dev:local

# 平台 public 工程，终端 2
pnpm serve:local

# 当前子应用，终端 3
pnpm dev:public
```

访问入口为 `http://localhost:8001/`，`8002` 仅提供 public Federation 资源。

## 构建

```bash
pnpm build:dev
pnpm build:sit
pnpm build:uat
pnpm build:pre
pnpm build:prd
```

构建不接受本地后端或本地 public 参数，防止将本地地址带入部署产物。
