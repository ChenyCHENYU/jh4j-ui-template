import type { Plugin } from "vite";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

/**
 * 子应用身份卡生成模板（由 wl-ui-public 仓库统一维护，schemaVersion 1）
 * ============================================================
 *
 * 用途：子应用构建时在产物目录生成 env.json（纯身份卡），部署后浏览器访问
 * `https://<环境域名>/sub/<模块名>/env.json` 即可查看该应用的部署身份
 * （哪次提交 / 哪条流水线 / 几点构建 / 工作区是否干净）。
 *
 * 接入方式（每项目一次，约 3 行）：
 *   1. 把本文件复制到子应用 `vite/plugins/gen-env-json.ts`（内容不改）；
 *   2. 在 vite 插件装配处（如 vite/config/plugins.ts）import 并加入插件数组：
 *      genEnvJson({ appId: "wl-ui-xxx", publicPath: "/sub/xxx/", env: context.target })
 *
 * 安全性：本插件 apply:"build"，仅在构建收尾写一个静态 JSON 文件；
 * 运行时无任何代码读取子应用 env.json（壳只读 sub/public/env.json），
 * Network 零请求、零依赖、零运行时影响。
 *
 * Jenkins 注意：CI 检出通常是 detached HEAD，branch 字段会显示 "HEAD"，
 * 溯源以 commitSha 为准（与门户 env.json 行为一致）。
 */

export interface SubAppEnvJsonOptions {
  /** 项目标识，如 "wl-ui-produce" */
  appId: string;
  /** 部署路径，如 "/sub/produce/" */
  publicPath: string;
  /** 构建环境标识（dev/sit/uat/pre/prd） */
  env: string;
}

/** git 信息读取：浅克隆 / 无 git 环境下逐项兜底，绝不阻断构建 */
function gitSafe(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function genEnvJson(options: SubAppEnvJsonOptions): Plugin {
  const { appId, publicPath, env } = options;

  return {
    name: `${appId}:gen-env-json`,
    apply: "build",
    writeBundle(outputOptions) {
      const commitSha = gitSafe("rev-parse HEAD");
      const branch = gitSafe("rev-parse --abbrev-ref HEAD");
      const dirty = gitSafe("status --porcelain").length > 0;
      const pipelineId = String(
        process.env.CI_PIPELINE_ID ||
          process.env.BUILD_NUMBER ||
          process.env.BUILD_ID ||
          ""
      ).trim();

      let packageVersion = "";
      try {
        const pkg = JSON.parse(
          readFileSync(resolve(process.cwd(), "package.json"), "utf-8")
        );
        packageVersion = String(pkg.version || "");
      } catch {
        packageVersion = "";
      }

      const content = JSON.stringify(
        {
          schemaVersion: 1,
          application: {
            id: appId,
            name: appId,
            version: packageVersion
          },
          build: {
            environment: env,
            branch: branch || "unknown",
            commitSha: commitSha || "unknown",
            commitShort: commitSha ? commitSha.slice(0, 8) : "unknown",
            dirty,
            pipelineId,
            builtAt: formatTimestamp(new Date())
          },
          runtime: {
            publicPath
          }
        },
        null,
        2
      );

      const outDir = outputOptions.dir || "dist";
      const dir = resolve(process.cwd(), outDir);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const target = resolve(dir, "env.json");
      writeFileSync(target, content, "utf-8");
      console.log(
        `[gen-env-json] 已生成 ${target}（env=${env}, commit=${commitSha ? commitSha.slice(0, 8) : "unknown"}${dirty ? "(dirty)" : ""}）`
      );
    }
  };
}
