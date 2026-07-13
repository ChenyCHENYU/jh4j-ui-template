import { parseParam } from "@jhlc/common-core/src/util/path";
import { getEnv } from "@/util/jh4j";

export type CloudEnv = "dev" | "sit" | "uat" | "pre" | "prd" | "prod";

export const CloudEnvOptions = [
  { value: "dev", label: "DEV" },
  { value: "sit", label: "SIT" },
  { value: "uat", label: "UAT" },
  { value: "pre", label: "PRE" },
  { value: "prd", label: "PRD" },
  { value: "prod", label: "PROD" }
];

export const envIpMap: Record<string, string> = {};

export const initEnvIp = function() {
  const env = getEnv();
  return env.webUrl?.replace(/_/g, ".");
};

export const getEnvIpMap = function() {
  return envIpMap || {};
};

export const systemModules = ["systemApp"];

export const UrlPrefixEnum = {
  w_01_: "w_01_",
  w_02_: "w_02_",
  c_01_: "c_01_",
  u_01_: "u_01_",
  u_02_: "u_02_"
};

export const FetchUserInfoUrlPrefix = [UrlPrefixEnum.u_01_, UrlPrefixEnum.u_02_];

export const LocalStorageTokenUrlPrefix = [
  UrlPrefixEnum.c_01_,
  UrlPrefixEnum.u_01_
];

export const SpecialUrlList = [
  UrlPrefixEnum.w_01_,
  UrlPrefixEnum.w_02_,
  UrlPrefixEnum.c_01_,
  UrlPrefixEnum.u_01_,
  UrlPrefixEnum.u_02_
];

export const getUrlType = function() {
  let path = window.location.pathname;
  const params = location.search ? parseParam("index" + location.search) : {};
  const sso = ["citicOaSso", "citicMarketSso", "citicMarketUserSso"];
  if (sso.some((item) => path.includes(item))) {
    path = params["route"] || params["redirect"] || params["to"];
  }

  if (path.startsWith("/")) {
    path = path.substring(1);
  }

  if (path.startsWith(UrlPrefixEnum.w_01_)) {
    return UrlPrefixEnum.w_01_;
  }
  if (path.startsWith(UrlPrefixEnum.w_02_)) {
    return UrlPrefixEnum.w_02_;
  }
  if (path.startsWith(UrlPrefixEnum.c_01_)) {
    return UrlPrefixEnum.c_01_;
  }
  if (path.startsWith(UrlPrefixEnum.u_01_)) {
    return UrlPrefixEnum.u_01_;
  }
  return null;
};
