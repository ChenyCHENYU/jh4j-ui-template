import envConfig from "@jhlc/common-core/src/store/env-config";
import { ElMessage } from "element-plus";

type HiddenRouteLoader = () => Promise<any>;

const HIDDEN_ROUTE_MAP: Record<string, HiddenRouteLoader> = {
  // Example:
  // "/your-module/detail": () =>
  //   import("@/views/your-module/detail/index.vue")
};

function hasRoute(router: any, path: string) {
  return router.getRoutes?.().some((route: any) => route.path === path) ?? false;
}

export function ensureHiddenRoute(router: any, path: string) {
  if (hasRoute(router, path)) {
    return true;
  }

  const loader = HIDDEN_ROUTE_MAP[path];
  if (!loader) {
    return false;
  }

  router.addRoute({ path, component: loader });
  return true;
}

export function registerHiddenRoutes(router: any) {
  Object.keys(HIDDEN_ROUTE_MAP).forEach((path) => {
    ensureHiddenRoute(router, path);
  });

  const currentPath = router.currentRoute?.value?.path;
  const currentFullPath = router.currentRoute?.value?.fullPath;
  if (currentPath && currentFullPath && HIDDEN_ROUTE_MAP[currentPath]) {
    router.replace(currentFullPath);
  }
}

export async function navigateHidden(
  path: string,
  query?: Record<string, string>
) {
  const router = envConfig()?.router;
  if (!router) {
    ElMessage.error("Router is not ready. Please refresh and try again.");
    return;
  }

  if (!ensureHiddenRoute(router, path)) {
    location.href = router.resolve({ path, query }).href;
    return;
  }

  router.push({ path, query });
}
