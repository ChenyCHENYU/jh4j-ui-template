import type { ProxyOptions, ServerOptions } from "vite";
import { APP_CONFIG } from "./app";
import type { LocalApiTarget, ViteContext } from "./context";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createLocalApiProxy(
  context: ViteContext,
  localApi: LocalApiTarget
): ProxyOptions {
  const requestPrefix = `${context.baseApi}/${localApi.prefix}`;
  const requestPrefixPattern = new RegExp(`^${escapeRegExp(requestPrefix)}`);

  return {
    target: localApi.target,
    changeOrigin: true,
    rewrite: (path) => path.replace(requestPrefixPattern, ""),
    // 本地服务不经过平台 OAuth2，避免把远程 token 误传给本地后端。
    configure(proxy) {
      proxy.on("proxyReq", (proxyRequest) => {
        proxyRequest.removeHeader("Authorization");
      });
    }
  };
}

function createProxyConfig(context: ViteContext) {
  // ENV_LOCAL_API 前缀路由：本地起多个微服务时按网关前缀分流，
  // 键为正则形态且必须位于 baseApi 通配代理之前（前缀长者优先）。
  const localApiProxies = context.useLocalBackend
    ? Object.fromEntries(
        context.localApiTargets.map((localApi) => [
          `^${escapeRegExp(`${context.baseApi}/${localApi.prefix}`)}(?:/|$)`,
          createLocalApiProxy(context, localApi)
        ])
      )
    : {};

  const isSeparateApiServer =
    Boolean(context.apiServer) && context.apiServer !== context.webUrl;
  const baseApiRewrite = isSeparateApiServer
    ? (path: string) =>
        path.replace(new RegExp(`^${escapeRegExp(context.baseApi)}`), "")
    : undefined;

  return {
    // 具体业务路由必须位于 baseApi 通配代理之前。
    ...localApiProxies,
    [context.baseApi]: {
      target: context.apiServer || context.webUrl,
      changeOrigin: true,
      secure: false,
      ...(baseApiRewrite ? { rewrite: baseApiRewrite } : {})
    },
    "/assets": {
      target: context.isPublicLocal ? context.localPublicUrl : context.webUrl,
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path
    },
    ...(context.anyReportServer
      ? {
          "/anyrt": {
            target: context.anyReportServer,
            rewrite: (path: string) => path.replace(/^\/anyrt/, "")
          }
        }
      : {}),
    // /sub/public 必须在 /sub 之前声明，防止被宽泛规则提前截获。
    ...(context.isPublicLocal
      ? {
          "/sub/public": {
            target: context.localPublicUrl,
            rewrite: (path: string) => path.replace(/^\/sub\/public/, "")
          }
        }
      : {}),
    "/sub": {
      target: context.webUrl,
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path.replace(/^\/sub/, "/sub/")
    },
    "/node-server": {
      target: APP_CONFIG.nodeServerUrl,
      rewrite: (path: string) => path.replace(/^\/node-server/, "")
    }
  };
}

export function createServerConfig(context: ViteContext): ServerOptions {
  return {
    hmr: true,
    host: "0.0.0.0",
    port: APP_CONFIG.devServerPort,
    strictPort: true,
    cors: true,
    headers: {
      "Permissions-Policy": "unload=(self)"
    },
    proxy: createProxyConfig(context)
  };
}
