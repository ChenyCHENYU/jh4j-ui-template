import { loadEnv, type ConfigEnv } from "vite";
import type { PluginOption } from "../plugins/type";
import {
  APP_CONFIG,
  APP_ENVS,
  getEnvOption,
  isAppEnv,
  type AppEnv
} from "./app";
import { ENVIRONMENTS } from "./environments";

type Source = "remote" | "local";
export type DevMode = "remote" | "backend" | "public";

/** 本地后端路由目标：prefix 为网关前缀（相对 baseApi） */
export interface LocalApiTarget {
  prefix: string;
  target: string;
}

export interface RuntimeEnvironment {
  VUE_APP_BASE_API: string;
  VUE_APP_PREFIX: string;
  VUE_APP_TOKEN_LOCALSTORAGE: string;
  APP_NAME: string;
  ANY_REPORT_SERVER: string;
  ANY_REPORT_SECRET_KEY: string;
  IS_PLATFORM: true;
  VERSION: string;
  OPTION: PluginOption;
}

export interface ViteContext {
  root: string;
  command: ConfigEnv["command"];
  target: AppEnv;
  isBuild: boolean;
  devMode: DevMode;
  useLocalBackend: boolean;
  isPublicLocal: boolean;
  base: string;
  baseApi: string;
  webUrl: string;
  webApi: string;
  apiServer: string;
  localApiTargets: LocalApiTarget[];
  localPublicUrl: string;
  anyReportServer: string;
  version: string;
  buildTimestamp: number;
  rawEnv: Record<string, string>;
  pluginOption: PluginOption;
  runtimeEnv: RuntimeEnvironment;
}

function readCliValue(name: string, argv: string[]) {
  const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.split("=").slice(1).join("=");

  const index = argv.indexOf(`--${name}`);
  if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }

  return "";
}

function resolveSource(name: "backend" | "public", argv: string[]): Source {
  const value = (readCliValue(name, argv) || "remote").toLowerCase();
  if (value !== "remote" && value !== "local") {
    throw new Error(`[dev] --${name} only supports "remote" or "local".`);
  }
  return value;
}

function normalizeApiPrefix(prefix: string) {
  return prefix.replace(/^\/+/, "").replace(/\/+$/, "");
}

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/**
 * 解析 ENV_LOCAL_API 本地后端目标（仅 dev:local 模式使用）：
 * - 空值：回退 project.config.json 的 localBackendUrl，整个模块接口走同一服务；
 * - 裸 URL（不含 "="）：同上，等价 v1.2 的单服务形态；
 * - 前缀路由：`pl=http://localhost:10301;pb=http://localhost:10205`，
 *   按网关前缀把不同微服务路由到不同本地进程，前缀长者优先匹配。
 */
function parseLocalApiTargets(value: string | undefined): LocalApiTarget[] {
  const fallback = () => [
    {
      prefix: APP_CONFIG.moduleName,
      target: removeTrailingSlash(APP_CONFIG.defaultLocalBackendUrl)
    }
  ];
  const raw = value?.trim();
  if (!raw) return fallback();
  if (!raw.includes("=")) {
    return [
      { prefix: APP_CONFIG.moduleName, target: removeTrailingSlash(raw) }
    ];
  }

  const targets = raw
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf("=");
      if (separatorIndex <= 0 || separatorIndex === item.length - 1) {
        throw new Error(
          `[dev:local] Invalid ENV_LOCAL_API item "${item}". Expected: prefix=http://host:port`
        );
      }

      const prefix = normalizeApiPrefix(item.slice(0, separatorIndex).trim());
      const target = removeTrailingSlash(item.slice(separatorIndex + 1).trim());

      if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) {
        throw new Error(
          `[dev:local] Invalid API prefix "${prefix}" in ENV_LOCAL_API.`
        );
      }

      let targetUrl: URL;
      try {
        targetUrl = new URL(target);
      } catch {
        throw new Error(
          `[dev:local] Invalid local API URL "${target}" in ENV_LOCAL_API.`
        );
      }
      if (
        !["http:", "https:"].includes(targetUrl.protocol) ||
        targetUrl.username ||
        targetUrl.password ||
        targetUrl.search ||
        targetUrl.hash
      ) {
        throw new Error(
          `[dev:local] ENV_LOCAL_API only supports plain HTTP(S) URLs without credentials, query, or hash: "${target}".`
        );
      }

      return { prefix, target };
    });

  const prefixes = new Set<string>();
  for (const item of targets) {
    if (prefixes.has(item.prefix)) {
      throw new Error(
        `[dev:local] Duplicate API prefix "${item.prefix}" in ENV_LOCAL_API.`
      );
    }
    prefixes.add(item.prefix);
  }

  return targets.sort(
    (left, right) => right.prefix.length - left.prefix.length
  );
}

function formatVersion(now: Date) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}

// 平台运行时会在 getEnv() 中将下划线还原为点，避免 URL 被 define 序列化后误读。
function encodeRuntimeUrl(value: string) {
  return value.replace(/\./g, "_");
}

export function resolveViteContext(
  configEnv: ConfigEnv,
  argv = process.argv,
  root = process.cwd(),
  now = new Date()
): ViteContext {
  // 目标环境解析优先级：--target CLI 参数 > DEV_SERVER_ENV 环境变量
  // （与 wl-ui-produce 对齐，团队可在不改脚本的情况下统一切环境）> mode。
  const requestedTarget =
    readCliValue("target", argv) ||
    process.env.DEV_SERVER_ENV ||
    configEnv.mode;
  if (!isAppEnv(requestedTarget)) {
    throw new Error(
      `[env] Unsupported target "${requestedTarget}". Use: ${APP_ENVS.join(", ")}`
    );
  }

  const backendSource = resolveSource("backend", argv);
  const publicSource = resolveSource("public", argv);
  if (backendSource === "local" && publicSource === "local") {
    throw new Error(
      "[dev] Local backend and local public are separate workflows; choose one."
    );
  }

  const isBuild = configEnv.command === "build";
  if (isBuild && (backendSource === "local" || publicSource === "local")) {
    throw new Error(
      "[build] Local development sources cannot be used for builds."
    );
  }

  const target = requestedTarget;
  const rawEnv = loadEnv(target, root, "");
  const environment = ENVIRONMENTS[target];
  const webUrl = removeTrailingSlash(
    rawEnv["ENV_WEB_URL"] || environment.webUrl
  );
  const baseApi =
    "/" + normalizeApiPrefix(rawEnv["ENV_API_PREFIX"] || environment.apiPrefix);
  const webApi = `${webUrl}${baseApi}`;
  const apiServer = removeTrailingSlash(
    rawEnv["ENV_API_SERVER"] || (environment as any).apiServer || webUrl
  );
  const useLocalBackend = backendSource === "local";
  const isPublicLocal = publicSource === "local";
  const devMode: DevMode = isPublicLocal
    ? "public"
    : useLocalBackend
      ? "backend"
      : "remote";
  // 每次进程级时间戳会让 Vite 依赖缓存在每次 dev 重启后失效；构建保留
  // 发布时间戳，dev 使用稳定缓存标签（对齐 wl-ui-produce 08a83c3e）。
  const version = isBuild ? formatVersion(now) : "dev";

  const pluginOption: PluginOption = {
    isBuild,
    debug: argv.includes("--debug"),
    // 兼容平台公共包：历史 isLocal 字段现在仅表示 public 是否在本地。
    isLocal: isPublicLocal,
    isPublicLocal,
    devMode,
    baseApi,
    module: APP_CONFIG.moduleName,
    env: target,
    ...getEnvOption(target),
    version,
    webUrl,
    webApi,
    apiServer
  };

  const runtimeEnv: RuntimeEnvironment = {
    VUE_APP_BASE_API: baseApi,
    VUE_APP_PREFIX: readCliValue("base", argv),
    VUE_APP_TOKEN_LOCALSTORAGE: rawEnv["TOKEN_LOCALSTORAGE"],
    APP_NAME: rawEnv["VITE_APP_TITLE"] || APP_CONFIG.defaultTitle,
    ANY_REPORT_SERVER: rawEnv["ENV_ANY_REPORT_SERVER"],
    ANY_REPORT_SECRET_KEY: rawEnv["ENV_ANY_REPORT_SECRET_KEY"],
    IS_PLATFORM: true,
    VERSION: version,
    OPTION: {
      ...pluginOption,
      webUrl: encodeRuntimeUrl(webUrl),
      webApi: encodeRuntimeUrl(webApi)
    }
  };

  return {
    root,
    command: configEnv.command,
    target,
    isBuild,
    devMode,
    useLocalBackend,
    isPublicLocal,
    base: runtimeEnv.VUE_APP_PREFIX,
    baseApi,
    webUrl,
    webApi,
    apiServer,
    localApiTargets: useLocalBackend
      ? parseLocalApiTargets(rawEnv["ENV_LOCAL_API"])
      : [],
    localPublicUrl: removeTrailingSlash(
      rawEnv["ENV_LOCAL_PUBLIC"] || APP_CONFIG.defaultLocalPublicUrl
    ),
    anyReportServer: rawEnv["ENV_ANY_REPORT_SERVER"],
    version,
    buildTimestamp: isBuild ? now.getTime() : 0,
    rawEnv,
    pluginOption,
    runtimeEnv
  };
}
