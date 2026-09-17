#!/usr/bin/env node
import { spawnSync } from "node:child_process";

/**
 * 模板级类型检查（对 pnpm typecheck 的包装）：
 *
 * 平台依赖 @jhlc/common-core 以 TS 源码形式发包（package.json main 指向
 * src/main.ts），业务代码通过 `@jhlc/common-core/src/*` 深路径引用会把
 * 平台源码整体拉进 vue-tsc 编译图，产生大量平台侧类型错误（含其内部
 * `@/` 别名无法在消费方项目解析等），任何直接消费该包的项目都无法
 * 全量 typecheck 通过（生产项目实测同此结论）。
 *
 * 因此本脚本的卡门口径为：
 * 1. 只对本仓库 src/ 与 vite/ 下文件的类型错误失败退出；
 * 2. node_modules 内的平台错误仅统计汇总，不阻断（等待平台包发布
 *    编译产物后可移除本包装，恢复裸 vue-tsc）。
 */

const result = spawnSync("vue-tsc --noEmit -p tsconfig.json", {
  encoding: "utf8",
  shell: true
});

const output = String(result.stdout || "") + String(result.stderr || "");
const lines = output.split(/\r?\n/).filter(Boolean);

const ownErrors = [];
let platformErrors = 0;

for (const line of lines) {
  const match = line.match(/^(.+?)\(\d+,\d+\): error TS\d+: /);
  if (!match) continue;
  const file = match[1].replace(/\\/g, "/");
  if (file.includes("/node_modules/")) {
    platformErrors += 1;
  } else {
    ownErrors.push(line);
  }
}

if (ownErrors.length > 0) {
  console.error("[typecheck] 本仓库代码存在类型错误：\n");
  for (const line of ownErrors) {
    console.error(line);
  }
  console.error(`\n[typecheck] 失败：${ownErrors.length} 处本仓库错误。`);
  process.exit(1);
}

console.log(
  `[typecheck] 通过：本仓库代码 0 错误` +
    (platformErrors > 0
      ? `（另有 ${platformErrors} 处平台依赖 node_modules 内错误，已按口径豁免）`
      : "") +
    "."
);
