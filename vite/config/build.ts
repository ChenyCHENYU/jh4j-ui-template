import path from "path";
import type { BuildOptions } from "vite";
import type { ViteContext } from "./context";

export function createBuildConfig(context: ViteContext): BuildOptions {
  const timestamp = context.buildTimestamp;

  return {
    // 2026-09 放弃联邦增量打包后改为全量构建，dist 清空重建，
    // 避免历史 chunk 无限堆积（生产项目曾膨胀到 18,259 文件/599MB）。
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    minify: "esbuild",
    reportCompressedSize: false,
    cssCodeSplit: false,
    // Federation 产物统一使用原生 ES2022；现代浏览器原生支持 top-level
    // await，无需 vite-plugin-top-level-await 转换及其 @swc/core 依赖。
    target: "es2022",
    // ES2022 浏览器原生支持 modulepreload，避免注入 Vite 的 legacy shim。
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: path.resolve(context.root, "index.html")
      },
      output: {
        chunkFileNames: `assets/js/src-[name].[hash]-jh_d-${timestamp}.js`,
        entryFileNames: `assets/js/[name]-jh_d-${timestamp}.js`,
        assetFileNames: "assets/[name].[hash].[ext]"
      }
    }
  };
}
