import autoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default function createAutoImport() {
  return autoImport({
    imports: [
      "vue",
      "vue-router",
      "pinia",
      {
        // Element Plus 自动导入
        "element-plus": ["ElMessage", "ElMessageBox", "ElLoading"]
      }
    ],
    resolvers: [ElementPlusResolver()],
    dts: "src/auto-imports.d.ts",
    eslintrc: {
      enabled: false
    }
  });
}
