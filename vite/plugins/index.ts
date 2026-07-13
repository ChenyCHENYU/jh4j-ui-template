import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";
import createAutoImport from "./auto-import";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from "path";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import WindiCSS from "vite-plugin-windicss";
import * as fs from "fs";
import { PluginOption } from "./type";
import topLevelAwait from "vite-plugin-top-level-await";
import { getSharedComponents } from "./shared";
import fullImportPlugin from "./full-import";
import { safeList } from "./windi-css/safe-list";
import CommonVitePlugin from "@jhlc/common-vite-plugin";

export default async function createVitePlugins(viteEnv, option: PluginOption) {
  console.log("插件参数：", option);
  const filename = `remoteEntry.js`;
  let pageNum = 0;
  const vitePlugins = [
    vueJsx(),
    vue(),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), "src/assets/icons/svg")],
      symbolId: "icon-[dir]-[name]",
      svgoOptions: true
    }),
    createAutoImport(option),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: "src/components.d.ts",
      dirs: ["src/components"],
      // 深度扫描
      deep: true,
      // 允许子目录作为组件的命名空间
      directoryAsNamespace: false
    }),
    WindiCSS(
      option.isPublicLocal
        ? {
            config: {
              important: true,
              extract: {
                include: ["./index.html"]
              },
              safelist: [...safeList()]
            }
          }
        : {
            config: {
              important: true,
              extract: {
                include: ["./index.html", `src/views/${option.module}/**/*.vue`]
              },
              safelist: []
            }
          }
    ),
    {
      name: "generate-version-file",
      closeBundle() {
        if (!option.isBuild) {
          return;
        }
        const content = CommonVitePlugin.getMicroVersionContent(
          option.version,
          option.module,
          filename,
          String(pageNum)
        );
        try {
          fs.mkdirSync(path.resolve(__dirname, "../../dist"));
        } catch (e) {}
        const outputPath = path.resolve(__dirname, "../../dist", "version.js");
        fs.writeFileSync(outputPath, content);
        console.log(
          `------>Version file generated at ${outputPath}, content: ${content}`
        );

        CommonVitePlugin.convertCn2Tw(path.resolve(__dirname, "../../dist"));
      }
    }
  ];

  const t = option.version;
  const webUrl = option.isBuild || option.isPublicLocal ? "" : option.webUrl;
  const mainRemoteEntry =
    option.isPublicLocal && !option.isBuild
      ? `/sub/public/assets/${filename}?t=${t}`
      : `/assets/${filename}?t=${t}`;
  const remotes = {
    main: mainRemoteEntry,
    systemApp: `${
      option.isBuild ? "" : webUrl
    }/sub/systemApp/assets/remoteEntry.js?t=${t}`,
    agGridApp: `${
      option.isBuild ? "" : webUrl
    }/sub/ag-grid/assets/remoteEntry.js?t=${t}`
  };
  // 主系统
  console.log(option.webUrl);

  const exposes = getSharedComponents();

  console.log("文件：" + filename, {
    module: option.module,
    filename
  });

  let options: any = {};
  if (option.isBuild) {
    try {
      options = await CommonVitePlugin.federationIncreaseOption(
        option as any,
        exposes,
        filename
      );
    } catch (e) {
      console.warn(
        "[federationIncreaseOption] 增量打包接口不可用，跳过（本地联调正常）",
        (e as Error).message
      );
    }
  }
  pageNum = Object.keys(exposes).length;
  if (pageNum < 1) {
    throw new Error("当前无变更代码，无需打包..");
  }
  console.log("最终打包：", pageNum, exposes);
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
        },
        // 增量打包
        ...options
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
  vitePlugins.unshift(fullImportPlugin(option));
  if (option.isBuild) {
    vitePlugins.push(
      topLevelAwait({
        promiseExportName: "__tla",
        promiseImportName: (i) => `__tla_${i}`
      })
    );
  }

  return vitePlugins;
}
