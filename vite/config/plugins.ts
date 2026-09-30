import type { Plugin, PluginOption } from "vite";
import createVitePlugins from "../plugins";
import { genEnvJson } from "../plugins/gen-env-json";
import { APP_CONFIG } from "./app";
import type { ViteContext } from "./context";

function createRootIndexPlugin(): Plugin {
  return {
    name: "serve-root-index",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url === "/") {
          request.url = "/index.html";
        }
        next();
      });
    }
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createDocumentTitlePlugin(title: string): Plugin {
  return {
    name: "project-document-title",
    transformIndexHtml(html) {
      return html.replace(
        /<title>.*?<\/title>/i,
        `<title>${escapeHtml(title)}</title>`
      );
    }
  };
}

export async function createConfigPlugins(
  context: ViteContext
): Promise<PluginOption[]> {
  const appPlugins = await createVitePlugins(
    context.rawEnv,
    context.pluginOption
  );

  return [
    createRootIndexPlugin(),
    createDocumentTitlePlugin(context.runtimeEnv.APP_NAME),
    // 子应用身份卡：构建产物生成 env.json（纯展示文件，运行时无人读取）。
    // appId 使用包名（project.config.json 的 projectName），publicPath 与
    // 构建基座路径保持一致。
    genEnvJson({
      appId: APP_CONFIG.projectName,
      publicPath: `/sub/${APP_CONFIG.moduleName}/`,
      env: context.target
    }),
    ...appPlugins
  ];
}
