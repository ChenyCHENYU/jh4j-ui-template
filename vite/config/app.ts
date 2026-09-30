import type { PluginOption } from "../plugins/type";
import projectConfig from "../../project.config.json";

export const APP_ENVS = ["dev", "sit", "uat", "pre", "prd"] as const;

export type AppEnv = (typeof APP_ENVS)[number];

export const APP_CONFIG = {
  projectName: projectConfig.projectName,
  moduleName: projectConfig.moduleName,
  devServerPort: projectConfig.devServerPort,
  defaultTitle: projectConfig.title,
  defaultLocalBackendUrl: projectConfig.localBackendUrl,
  defaultLocalPublicUrl: projectConfig.localPublicUrl,
  nodeServerUrl: projectConfig.nodeServerUrl
} as const;

const FR_DIR_BY_ENV: Record<AppEnv, PluginOption["frDir"]> = {
  dev: "jh_dev",
  sit: "jh_sit",
  uat: "jh_uat",
  pre: "jh_pre",
  prd: "jh"
};

export function isAppEnv(value: string): value is AppEnv {
  return APP_ENVS.includes(value as AppEnv);
}

export function getEnvOption(env: AppEnv): Pick<PluginOption, "frDir"> {
  return { frDir: FR_DIR_BY_ENV[env] };
}
