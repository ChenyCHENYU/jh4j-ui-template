import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";
import createAutoImport from "./auto-import";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from "path";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import * as fs from "fs";
import { PluginOption } from "./type";
import topLevelAwait from "vite-plugin-top-level-await";
import { getSharedComponents } from "./shared";
import fullImportPlugin from "./full-import";
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
    // 2026-09 退出 windicss：模板内无原子类消费方（示例页已改为普通
    // class），safe-list 生成的数千类为死代码 CSS。等效 preflight 已迁至
    // src/assets/style/main.scss 顶部。
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

  // 2026-09 放弃远端增量打包（federationIncreaseOption）：该机制依赖
  // dist 历史堆积做 diff（emptyOutDir 必须为 false），产物会无限膨胀
  // （生产项目实测 18,259 文件/599MB，其中 9,089 个繁体副本），且增量
  // 接口不稳定时静默跳过反而造成"增量/全量"两种不可控行为。改为每次
  // 全量构建，dist 清空重建。
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
