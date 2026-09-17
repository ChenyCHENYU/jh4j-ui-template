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
