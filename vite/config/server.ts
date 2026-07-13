import type { ProxyOptions, ServerOptions } from "vite";
import { APP_CONFIG } from "./app";
import type { ViteContext } from "./context";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createModuleProxy(context: ViteContext): ProxyOptions {
  const moduleApiPattern = new RegExp(
    `^${escapeRegExp(`${context.baseApi}/${APP_CONFIG.moduleName}`)}`
  );

  return {
    target: context.useLocalBackend ? context.localBackendUrl : context.webUrl,
    changeOrigin: true,
    ...(context.useLocalBackend ? {} : { secure: false }),
    rewrite: context.useLocalBackend
      ? (path) => path.replace(moduleApiPattern, "")
      : (path) => path,
    // 本地服务不经过平台 OAuth2，避免把远程 token 误传给本地后端。
    ...(context.useLocalBackend
      ? {
          configure(proxy) {
            proxy.on("proxyReq", (proxyRequest) => {
              proxyRequest.removeHeader("Authorization");
            });
          }
        }
      : {})
  };
}

function getModuleProxyPaths(context: ViteContext): string[] {
  const routePrefixes: readonly string[] = APP_CONFIG.localBackendRoutes;
  const modulePath = `${context.baseApi}/${APP_CONFIG.moduleName}`;

  if (routePrefixes.length === 0) return [modulePath];

  return routePrefixes.map(
    (route) => `${modulePath}/${route.replace(/^\/+|\/+$/g, "")}`
  );
}

function createProxyConfig(context: ViteContext) {
  const moduleProxies = Object.fromEntries(
    getModuleProxyPaths(context).map((path) => [
      path,
      createModuleProxy(context)
    ])
  );

  return {
    // 具体业务路由必须位于 baseApi 通配代理之前。
    ...moduleProxies,
    [context.baseApi]: {
      target: context.webUrl,
      changeOrigin: true,
      secure: false
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
