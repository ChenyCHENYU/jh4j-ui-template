import type { AppEnv } from "./app";
import projectConfig from "../../project.config.json";

type HttpUrl = `http://${string}` | `https://${string}`;

interface EnvironmentConfig {
  apiPrefix: string;
  webUrl: HttpUrl;
  apiServer?: HttpUrl;
}

export const ENVIRONMENTS = projectConfig.environments as Record<
  AppEnv,
  EnvironmentConfig
>;
