import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const REGISTER_ID = "virtual:svg-icons-register";
const NAMES_ID = "virtual:svg-icons-names";
const RESOLVED_REGISTER_ID = `\0${REGISTER_ID}`;
const RESOLVED_NAMES_ID = `\0${NAMES_ID}`;

/**
 * 自研 SVG 雪碧图注册插件（替代 vite-plugin-svg-icons，后者停在 2023 年、
 * 未适配 Vite 7）。保留其历史虚拟模块契约：入口 `import "virtual:svg-icons-register"`
 * 不变；symbolId 沿用 icon-[dir]-[name] 规则。本模板图标目录为
 * src/assets/icons/svg（当前仅示例图标，多数由平台公共层提供）。
 */
export function createSvgIconsRegisterPlugin(options?: {
  iconDirs?: string[];
}): Plugin {
  const iconDirs = options?.iconDirs ?? [
    path.resolve(process.cwd(), "src/assets/icons/svg")
  ];

  function collectSvgFiles(
    dir: string,
    base = dir
  ): { id: string; file: string }[] {
    const results: { id: string; file: string }[] = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectSvgFiles(full, base));
        continue;
      }
      if (!entry.name.endsWith(".svg")) continue;
      const relative = path.relative(base, full).replace(/\\/g, "/");
      const withoutExt = relative.replace(/\.svg$/, "");
      const symbolId = `icon-${withoutExt.split("/").join("-")}`;
      results.push({ id: symbolId, file: full });
    }
    return results;
  }

  const icons = iconDirs.flatMap((dir) => collectSvgFiles(dir));

  function createSymbol({ id, file }: { id: string; file: string }) {
    const raw = fs.readFileSync(file, "utf8");
    // 保留源文件内部属性，剥离 xml 声明与外层 <svg> 标签本身
    const viewBoxMatch = raw.match(/viewBox="[^"]+"/);
    const inner = raw
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<\/?svg[^>]*>/g, "");
    return `<symbol id="${id}" ${viewBoxMatch ? viewBoxMatch[0] : ""}>${inner}</symbol>`;
  }

  const symbols = icons.map(createSymbol).join("\n");
  const sprite = symbols
    ? `if (typeof window !== "undefined") {
  function loadSvg() {
    var body = document.body;
    var svgDom = document.getElementById("__svg__icons__dom__");
    if (!svgDom) {
      svgDom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgDom.style.position = "absolute";
      svgDom.style.width = "0";
      svgDom.style.height = "0";
      svgDom.id = "__svg__icons__dom__";
      svgDom.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgDom.setAttribute("xmlns:link", "http://www.w3.org/1999/xlink");
    }
    svgDom.innerHTML = ${JSON.stringify(symbols)};
    body.insertBefore(svgDom, body.lastChild);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSvg);
  } else {
    loadSvg();
  }
}
export default {};
`
    : `
if (typeof window !== "undefined") {
  function loadSvg() {
    var body = document.body;
    var svgDom = document.getElementById("__svg__icons__dom__");
    if (!svgDom) {
      svgDom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgDom.style.position = "absolute";
      svgDom.style.width = "0";
      svgDom.style.height = "0";
      svgDom.id = "__svg__icons__dom__";
      svgDom.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgDom.setAttribute("xmlns:link", "http://www.w3.org/1999/xlink");
    }
    svgDom.innerHTML = "";
    body.insertBefore(svgDom, body.lastChild);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSvg);
  } else {
    loadSvg();
  }
}
export default {};
`;

  return {
    name: "wl:svg-icons-register",
    resolveId(id) {
      if (id === REGISTER_ID) return RESOLVED_REGISTER_ID;
      if (id === NAMES_ID) return RESOLVED_NAMES_ID;
    },
    load(id) {
      if (id === RESOLVED_REGISTER_ID) return sprite;
      if (id === RESOLVED_NAMES_ID)
        return `export default ${JSON.stringify(icons.map((i) => i.id))};`;
    }
  };
}
