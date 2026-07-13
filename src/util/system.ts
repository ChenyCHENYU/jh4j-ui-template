import { getViewPage } from "@/util/pages-dev";
import { defineAsyncComponent } from "vue";
import {
  __federation_method_getRemote,
  __federation_method_setRemote,
  __federation_method_unwrapDefault
} from "virtual:__federation__";
import { GlobalComponent } from "@jhlc/common-core/src/global/global-components";
import { systemModules } from "@/types/jh4j-cloud";
import { getEnv } from "@/util/jh4j";

export const federation_method_getRemote = function(module: string, path: string) {
  return __federation_method_getRemote(module, path);
};

export const federation_method_unwrapDefault = function(moduleWrapped: any) {
  return __federation_method_unwrapDefault(moduleWrapped);
};

export const federation_method_setRemote = function(module: string, config: any) {
  return __federation_method_setRemote(module, config);
};

let remoteFetchFlag: Record<string, boolean> = {};
const styleMap: Record<string, boolean> = {};

const getEntry = function(module: string) {
  const env = getEnv();
  return new Promise((resolve) => {
    const filename = "remoteEntry.js";
    if (env.isLocal) {
      return resolve(
        env.isBuild
          ? ""
          : `/sub/${module}/assets/${filename}?t=${new Date().getTime()}`
      );
    }
    return resolve(`/sub/${module}/assets/${filename}?v=${new Date().getTime()}`);
  });
};

const updateRemoteAndFetch = function(module: string, path: string): Promise<any> {
  return getEntry(module).then((url) => {
    federation_method_setRemote(module, {
      url: () => Promise.resolve(url),
      format: "esm",
      from: "vite"
    });
    return federation_method_getRemote(module, path).then((moduleWrapped) =>
      federation_method_unwrapDefault(moduleWrapped)
    );
  });
};

const doFetchAsyncComponent = async function(
  module: string,
  path: string,
  isRemote?: boolean
): Promise<any> {
  const env = getEnv();
  if (!module || !path) {
    return Promise.resolve(null);
  }

  if (!env.isBuild && isRemote !== true) {
    if (!styleMap[module] && !systemModules.includes(module)) {
      const stylePage = getViewPage(module, `./${module}/style/index.vue`);
      if (stylePage) {
        GlobalComponent.add(defineAsyncComponent(stylePage), `${module}_style`);
      }
      styleMap[module] = true;
    }
    const component = getViewPage(module, path);
    if (!component) {
      return Promise.resolve(null);
    }
    return component().then((res) => res?.default);
  }

  if (!remoteFetchFlag[module] && module) {
    await getEntry(module).then((url) => {
      federation_method_setRemote(module, {
        url: () => Promise.resolve(url),
        format: "esm",
        from: "vite"
      });
    });
    remoteFetchFlag[module] = true;
  }

  if (!styleMap[module] && !systemModules.includes(module)) {
    try {
      federation_method_getRemote(module, `./${module}/style/index.vue`)
        .then((moduleWrapped) => federation_method_unwrapDefault(moduleWrapped))
        .then((m) => {
          if (m) {
            GlobalComponent.add(m, `${module}_style`);
          }
        })
        .catch(() => {});
    } catch {}
    styleMap[module] = true;
  }

  const FETCH_TIMEOUT = 20000;
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          render() {
            return null;
          }
        });
      }
    }, FETCH_TIMEOUT);

    federation_method_getRemote(module, path)
      .then((moduleWrapped) => federation_method_unwrapDefault(moduleWrapped))
      .then((m) => {
        if (!settled && m) {
          settled = true;
          clearTimeout(timer);
          resolve(m);
        }
      })
      .catch(() => {
        updateRemoteAndFetch(module, path).then((m) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(m);
          }
        });
      });
  });
};

export const fetchAsyncComponent = function(
  module: string,
  path: string,
  fetchPath?: () => Promise<[string, string]>,
  isRemote?: boolean
) {
  return defineAsyncComponent(() => {
    return new Promise((resolve) => {
      if (!module || !path) {
        if (typeof fetchPath !== "function") {
          return resolve(null);
        }
        fetchPath().then(([m, p]) => {
          const ret = doFetchAsyncComponent(m, p, isRemote);
          return ret.then((res) => {
            if (!res && m && p) {
              console.error(`${m},${p}, file not found.`);
            }
            return resolve(res);
          });
        });
      } else {
        const ret = doFetchAsyncComponent(module, path, isRemote);
        return ret.then((res) => resolve(res));
      }
    });
  });
};

type DevFetchComponent = (module: string, path: string) => Promise<any>;

let devFetchComponent: DevFetchComponent | null = null;
export const setDevFetchComponent = function(fun: DevFetchComponent) {
  devFetchComponent = fun;
};

export const fetchComponent = function(module: string, path: string): Promise<any> {
  if (typeof devFetchComponent === "function") {
    return devFetchComponent(module, path);
  }
  return new Promise((resolve) => {
    const ret = doFetchAsyncComponent(module, path);
    return ret.then((res) => resolve(res));
  });
};

export const fetchRemoteComponent = function(
  module: string,
  path: string
): Promise<any> {
  return new Promise((resolve) => {
    const ret = doFetchAsyncComponent(module, path, true);
    return ret.then((res) => resolve(res));
  });
};
