import path from "path";
import type { UserConfig } from "vite";
import { APP_CONFIG } from "./app";
import type { ViteContext } from "./context";

const OPTIMIZED_DEPENDENCIES = [
  "@jhlc/common-core",
  // common-core 包入口是 TS 源码且业务大量深路径引用；不预先登记会让 vite
  // 在运行中才发现这些依赖 → 触发 re-optimize → 整页 reload（曾实测：页面
  // 首开 120s+ 且中途闪二次加载）。以下为平台组件/工具的深路径引用清单。
  "@jhlc/common-core/src/api/action",
  "@jhlc/common-core/src/api/login",
  "@jhlc/common-core/src/components/form/base-query/type",
  "@jhlc/common-core/src/components/form/common/type",
  "@jhlc/common-core/src/components/table/base-table/type",
  "@jhlc/common-core/src/components/toolbar/toolbar-data",
  "@jhlc/common-core/src/components/toolbar/type",
  "@jhlc/common-core/src/global/global-components",
  "@jhlc/common-core/src/page-hooks/form-hook",
  "@jhlc/common-core/src/page-hooks/page-query-hook",
  "@jhlc/common-core/src/store/business-logic-data",
  "@jhlc/common-core/src/store/env-config",
  "@jhlc/common-core/src/store/user",
  "@jhlc/common-core/src/types/window-flag",
  "@jhlc/common-core/src/util/excel-util",
  "@jhlc/common-core/src/util/file-util",
  "@jhlc/common-core/src/util/path",
  "@jhlc/common-core/src/util/real-request",
  "@jhlc/common-core/src/util/request",
  "element-plus/es",
  "element-plus/es/components/base/style/css",
  "element-plus/es/components/loading/style/css",
  "jquery",
  "lodash",
  "json-bigint",
  "jszip",
  "dayjs",
  "dayjs/plugin/customParseFormat.js",
  "dayjs/plugin/advancedFormat.js",
  "dayjs/plugin/localeData.js",
  "dayjs/plugin/weekOfYear.js",
  "dayjs/plugin/weekYear.js",
  "dayjs/plugin/dayOfYear.js",
  "dayjs/plugin/isSameOrAfter.js",
  "dayjs/plugin/isSameOrBefore.js"
];

export function createBaseConfig(context: ViteContext): UserConfig {
  return {
    appType: "spa",
    define: {
      "process.env": context.runtimeEnv
    },
    base: context.isBuild ? `/sub/${APP_CONFIG.moduleName}/` : "/",
    css: {
      postcss: {
        plugins: []
      }
    },
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
      alias: [
        {
          find: "@",
          replacement: path.resolve(context.root, "src")
        }
      ]
    },
    optimizeDeps: {
      exclude: ["@jhlc/utils", "@jhlc/types", "pinia", "vue-router"],
      include: OPTIMIZED_DEPENDENCIES
    },
    esbuild: {
      target: "es2022"
    }
  };
}
