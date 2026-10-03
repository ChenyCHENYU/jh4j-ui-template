declare global {
  interface Window {
    __WL_PUBLIC_ENV_PROMISE__?: Promise<unknown>;
    __WL_PUBLIC_ENV__?: Record<string, unknown>;
  }
}

// dev 下代理前缀由本地 vite proxy 决定，保持构建兜底值即可；
// 仅生产构建接管：环境以 wl-ui-public 部署的 env.json 为准。
// 依据《子应用环境管控规范（以 public 的 env.json 为准）》接入，
// 门禁卡控由 wl-ui-public 中心化承担，子应用只做本集成。
export const publicEnvReady: Promise<unknown> = import.meta.env.PROD
  ? (window.__WL_PUBLIC_ENV_PROMISE__ ??= fetch("/sub/public/env.json", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => {
        if (e) window.__WL_PUBLIC_ENV__ = e;
        return e;
      })
      .catch(() => null))
  : Promise.resolve(null);

/**
 * 运行时环境合并视图：构建兜底值 + public 下发的 env.json 深合并
 * （含 OPTION 嵌套）。每次调用都读取最新的 window.__WL_PUBLIC_ENV__，
 * 语义等价于历史上的 define-IIFE 方案（Vite 7 的 define 只接受实体名
 * 或 JS 字面量，IIFE 不再可用），经平台官方通道 getProcessEnv 消费。
 * 错误 mode 打包的兜底值也会被 env.json 拉正，串线防控由 public 中心化承担。
 */
export function resolveRuntimeEnv<T extends object>(baked: T): T {
  const runtime = window.__WL_PUBLIC_ENV__;
  if (!runtime) return baked;
  const bakedOption = (baked as { OPTION?: object }).OPTION;
  const runtimeOption = (runtime as { OPTION?: object }).OPTION;
  return Object.assign({}, baked, runtime, {
    OPTION: Object.assign({}, bakedOption, runtimeOption || {})
  });
}
