import path from "path";
import type { UserConfig } from "vite";
import { APP_CONFIG } from "./app";
import type { ViteContext } from "./context";

const OPTIMIZED_DEPENDENCIES = [
  "@jhlc/common-core",
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
