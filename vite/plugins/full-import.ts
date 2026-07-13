
import * as fs from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import { createRequire } from "node:module";
import type { Plugin, TransformResult } from "vite";
import { transformWithEsbuild } from "vite";
import type { PluginOption } from "./type";

/** 读取到的页面配置项格式 */
interface PageConfigItem {
  name: string;
  label: string;
}

/** vite 插件会合并这几个文件的 list */
const CONFIG_FILES = [
  "./shared/flow-detail.ts",
  "./shared/pages.ts",
  "./shared/message-detail.ts"
] as const;

const nodeRequire = createRequire(import.meta.url);

/** 去掉 name 上可能携带的 query：xxx.vue?abc -> xxx.vue */
function stripQuery(s: string): string {
  return (s || "").split("?")[0];
}

/**
 * 兼容 ESM/CJS 下的插件目录获取
 * - 如果运行环境提供 __dirname，就直接用
 * - 否则用 import.meta.url 推导
 */
function getPluginDir(): string {
  // eslint-disable-next-line no-undef
  if (typeof __dirname !== "undefined") return __dirname;
  return path.dirname(new URL(import.meta.url).pathname);
}

/**
 * 把 TS 源码编译成可执行的 CJS（CommonJS）代码字符串
 * - 用 Vite 内置 transformWithEsbuild：稳定、无需额外依赖
 */
async function compileTsToCjs(
  source: string,
  filename: string
): Promise<string> {
  const r: TransformResult = await transformWithEsbuild(source, filename, {
    loader: "ts",
    format: "cjs",
    target: "es2019",
    sourcemap: false
  });

  return r.code ?? "";
}

/**
 * 在沙箱中执行 CJS 模块代码，返回 module.exports
 * - 这相当于"加载这个配置模块"，而不是像以前那样 eval 一个数组字面量
 * - 好处：配置文件不再受 "必须写 const list = [ ... ]" 这种格式限制
 */
function runCjsModule(code: string, filename: string): unknown {
  const module = { exports: {} as unknown };
  const dirname = path.dirname(filename);

  const context = vm.createContext({
    require: nodeRequire,
    module,
    exports: module.exports,
    __filename: filename,
    __dirname: dirname,
    console
  });

  // Node 的 CJS 包装形态
  const wrapped = `(function (require, module, exports, __filename, __dirname) { ${code}\n})`;
  const fn = vm.runInContext(wrapped, context, { filename });

  (fn as Function)(nodeRequire, module, module.exports, filename, dirname);
  return module.exports;
}

/**
 * 从一个配置文件中读取 list
 * 支持导出：
 * - export const list = [...]
 * - export default [...]
 */
async function loadList(absPath: string): Promise<PageConfigItem[]> {
  if (!fs.existsSync(absPath)) return [];

  const source = fs.readFileSync(absPath, "utf-8");
  const code = await compileTsToCjs(source, absPath);
  if (!code) return [];

  const exportsObj = runCjsModule(code, absPath) as {
    list?: PageConfigItem[];
    default?: PageConfigItem[];
  };

  const raw: unknown = exportsObj?.list ?? exportsObj?.default;
  if (!Array.isArray(raw)) return [];

  // 规范化，保证字段存在且字符串化，去 query
  return raw.map((x: any) => ({
    name: stripQuery(String(x?.name ?? "")),
    label: String(x?.label ?? "")
  }));
}

/** 加载并合并所有配置文件 */
async function loadAllConfigs(pluginDir: string): Promise<PageConfigItem[]> {
  const all: PageConfigItem[] = [];

  for (const rel of CONFIG_FILES) {
    const abs = path.join(pluginDir, rel);
    all.push(...(await loadList(abs)));
  }

  return all;
}

/**
 * 生成 pages-dev.ts 需要的代码：
 * const list = [
 *   { name:"./xxx", label:"yyy", component: () => import("@/views/xxx") },
 * ]
 *
 * 用 JSON.stringify 做安全转义，避免 label 含引号导致语法报错
 */
function buildPagesDevListCode(items: PageConfigItem[]): string {
  const rows = items.map((it) => {
    const name = stripQuery(it.name);
    return `{
  name: ${JSON.stringify(`./${name}`)},
  label: ${JSON.stringify(it.label)},
  component: () => import(${JSON.stringify(`@/views/${name}`)}),
}`;
  });

  return `const list = [\n${rows.join(",\n")}\n]`;
}

/** 将生成的 const list = [...] 注入到 pages-dev.ts */
function injectList(code: string, generated: string): string {
  // 目标替换：const list = []
  const pattern = /const\s+list\s*=\s*\[\s*\]/;
  return pattern.test(code) ? code.replace(pattern, generated) : code;
}

export default function fullImportPlugin(option: PluginOption): Plugin {
  return {
    name: "fullImportElementPlus",

    /**
     * 这里尽量保持"业务主流程"短且清晰：
     * - dev：处理 App.vue
     * - dev：处理 pages-dev.ts
     */
    async transform(code, id) {
      // 1) 开发环境：移除 App.vue 中的某个样式 import（保留原逻辑）
      if (!option.isBuild && id.includes("App.vue")) {
        code = code.replace(
          /\@import\s+\'\@jhlc\/doc\/lib\/style\.css\'\;/g,
          ""
        );
      }

      // 2) 开发环境：只对 pages-dev.ts 注入 list
      if (!option.isBuild && id.includes("pages-dev.ts")) {
        const pluginDir = getPluginDir();
        const items = await loadAllConfigs(pluginDir);
        const generated = buildPagesDevListCode(items);
        code = injectList(code, generated);
      }

      return code;
    }
  };
}
