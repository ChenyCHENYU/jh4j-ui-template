import type { SharedPageItem } from "./utils";
import { APP_CONFIG } from "../../config/app";

type PageTuple = [string, string];
type SubModuleMap = Record<string, PageTuple[]>;

const gProd = (module: string, subModules: SubModuleMap): SharedPageItem[] =>
  Object.entries(subModules).flatMap(([subModule, pages]) =>
    pages.map(([page, label]) => ({
      name: `${module}/${subModule}/${page}/index.vue`,
      label
    }))
  );

const moduleStylePages: SharedPageItem[] = [
  { name: `${APP_CONFIG.moduleName}/style/index.vue`, label: "module style" }
];

const businessModule = gProd(APP_CONFIG.moduleName, {
  demo: [
    ["list", "Demo List"],
    ["detail", "Demo Detail"]
  ]
});

export const list: SharedPageItem[] = [
  ...moduleStylePages,
  ...businessModule
];

export default list;
