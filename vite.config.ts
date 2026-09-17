import { defineConfig } from "vite";
import { createBaseConfig } from "./vite/config/base";
import { createBuildConfig } from "./vite/config/build";
import { resolveViteContext } from "./vite/config/context";
import { createConfigPlugins } from "./vite/config/plugins";
import { createServerConfig } from "./vite/config/server";
import { assertBuildEnvironment } from "./vite/build-environment-guard";

export default defineConfig(async (configEnv) => {
  // 发布环境防串线：标准环境分支上，--mode 必须与分支一致（构建前强校验）。
  if (configEnv.command === "build") {
    assertBuildEnvironment({ mode: configEnv.mode });
  }

  const context = resolveViteContext(configEnv);

  return {
    ...createBaseConfig(context),
    server: createServerConfig(context),
    plugins: await createConfigPlugins(context),
    build: createBuildConfig(context)
  };
});
