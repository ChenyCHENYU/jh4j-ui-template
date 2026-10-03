import { resolveRuntimeEnv } from "@/util/public-env";

export const getEnv = function (): {
  env: "dev" | "sit" | "uat" | "pre" | "prd" | "prod";
  isBuild: boolean;
  baseApi: string;
  module: string;
  isLocal: boolean;
  webUrl: string;
  webApi: string;
  anyReportServer: string;
  frDir: string;
  version: string;
} {
  const ret = {
    ...(resolveRuntimeEnv(process.env).OPTION as unknown as Record<string, any>)
  };

  ret.webUrl = ret.webUrl.replace(/\_/g, ".");
  ret.webApi = ret.webApi.replace(/\_/g, ".");

  return ret as any;
};
