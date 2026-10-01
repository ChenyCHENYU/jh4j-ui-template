import path from "path";
import type { UserConfig } from "vite";
import { APP_CONFIG } from "./app";
import type { RuntimeEnvironment, ViteContext } from "./context";

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

/**
 * process.env 运行时化：构建值仅兜底，运行时以 wl-ui-public 部署的
 * env.json 深合并覆盖（含 OPTION 嵌套合并）。错误 mode 打包的兜底值
 * 也会被 env.json 拉正，串线防控由 public 中心化承担。
 */
function buildRuntimeProcessEnvDefine(runtimeEnv: RuntimeEnvironment): string {
  return `(function () {
  var baked = ${JSON.stringify(runtimeEnv)};
  var runtime = (typeof window !== "undefined" && window.__WL_PUBLIC_ENV__) || null;
  if (!runtime) return baked;
  return Object.assign({}, baked, runtime, {
    OPTION: Object.assign({}, baked.OPTION, runtime.OPTION || {})
  });
})()`;
}

export function createBaseConfig(context: ViteContext): UserConfig {
  return {
    appType: "spa",
    define: {
      "process.env": buildRuntimeProcessEnvDefine(context.runtimeEnv)
    },
    base: context.isBuild ? `/sub/${APP_CONFIG.moduleName}/` : "/",
    css: {
      // 复用少量常驻 Sass 编译器。默认按逻辑 CPU 各建一个 worker，对本
      // 项目反复导入的 scoped 样式会重复编译器启动/缓存开销。
      preprocessorMaxWorkers: 1,
      postcss: {
        plugins: []
      }
    },
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
      // 开发预打包与远程模块必须复用宿主实例，避免 Pinia/Vue 上下文分裂。
      dedupe: ["pinia", "vue", "vue-router", "element-plus"],
      alias: [
        {
          find: "@",
          replacement: path.resolve(context.root, "src")
        }
      ]
    },
    optimizeDeps: {
      exclude: ["@jhlc/utils", "@jhlc/types", "pinia", "vue-router"],
      include: OPTIMIZED_DEPENDENCIES,
      // 让浏览器与依赖优化器并行工作，而不是阻塞一次全应用爬取。
      holdUntilCrawlEnd: false
    },
    esbuild: {
      target: "es2022"
    }
  };
}
