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
