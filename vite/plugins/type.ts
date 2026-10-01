export interface PluginOption {
  isBuild: boolean;
  debug: boolean;
  // Kept for compatibility with platform packages; equivalent to isPublicLocal.
  isLocal: boolean;
  isPublicLocal: boolean;
  devMode: "remote" | "backend" | "public";
  baseApi: string;
  module: string;
  webUrl: string;
  // 接口地址
  webApi: string;
  env: "prd" | "pre" | "uat" | "sit" | "dev";
  // 帆软目录
  frDir: string;
  version: string;
}
