import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";
import createAutoImport from "./auto-import";
import path from "path";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { PluginOption } from "./type";
import { getSharedComponents, getSharedPageItems } from "./shared";
import fullImportPlugin from "./full-import";
import { createBuildArtifactsPlugin } from "./build-artifacts";
import { createSvgIconsRegisterPlugin } from "./svg-icons-register";

export default async function createVitePlugins(viteEnv, option: PluginOption) {
  const debugLog = (...args: unknown[]) => {
    if (option.debug) console.log(...args);
  };
  debugLog("Plugin options:", option);
  const filename = `remoteEntry.js`;
  let pageNum = 0;
  const sharedPageItems = getSharedPageItems(option.debug);
  const vitePlugins = [
    vue(),
    createSvgIconsRegisterPlugin(),
    createAutoImport(),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: "src/components.d.ts",
      dirs: ["src/components"],
      // 深度扫描
      deep: true,
      // 允许子目录作为组件的命名空间
      directoryAsNamespace: false
    }),
    // 2026-10 工具链升级（对齐 wl-ui-produce 08a83c3e）：version.js 与
    // 简繁双产物改由本插件承担，退役 @jhlc/common-vite-plugin（其 Vite 4
    // peer 锁与未声明的 opencc-js 依赖不再兼容 Vite 7）。
    option.isBuild
      ? createBuildArtifactsPlugin({
          filename,
          getPageNum: () => pageNum,
          moduleName: option.module,
          outputDirectory: path.resolve(process.cwd(), "dist"),
          version: option.version
        })
      : null
  ];

  const t = option.version;
  const mainRemoteEntry =
    option.isPublicLocal && !option.isBuild
      ? `/sub/public/assets/${filename}?t=${t}`
      : `/assets/${filename}?t=${t}`;
  const remotes = {
    main: mainRemoteEntry,
    systemApp: `/sub/systemApp/assets/remoteEntry.js?t=${t}`,
    agGridApp: `/sub/ag-grid/assets/remoteEntry.js?t=${t}`
  };
  // 主系统
  debugLog(option.webUrl);

  const exposes = getSharedComponents(sharedPageItems);

  debugLog("Federation entry:", {
    module: option.module,
    filename
  });

  // 2026-09 放弃远端增量打包（federationIncreaseOption）：该机制依赖
  // dist 历史堆积做 diff（emptyOutDir 必须为 false），产物无限膨胀（实测
  // 18,259 文件/599MB，其中 9,089 个繁体副本），增量接口不稳定时静默跳过
  // 反而造成"增量/全量"两种不可控行为。改为每次全量构建，dist 清空重建。
  pageNum = Object.keys(exposes).length;
  if (pageNum < 1) {
    throw new Error("当前无变更代码，无需打包..");
  }
  debugLog("Federation exposes:", pageNum, exposes);
  if (option.isBuild) {
    vitePlugins.push(
      federation({
        name: "remote-app",
        filename,
        remotes: {
          ...remotes
        },
        // 需要暴露的模块
        exposes: {
          ...exposes
        },
        shared: {
          vue: {},
          pinia: {},
          "vue-router": {},
          "@jhlc/common-core": {},
          "element-plus": {},
          "@vueuse/core": {}
        }
      })
    );
  } else {
    // 开发环境
    vitePlugins.push(
      federation({
        name: "main_app",
        filename: "remoteEntry.js",
        remotes,
        exposes: {},
        shared: {
          vue: {},
          pinia: {},
          "vue-router": {},
          "@jhlc/common-core": {},
          "element-plus": {},
          "@vueuse/core": {}
        }
      })
    );
  }
  // 该插件只注入开发页面清单，正式构建不做任何工作。
  if (!option.isBuild) {
    vitePlugins.unshift(fullImportPlugin(option, sharedPageItems));
  }

  return vitePlugins;
}
