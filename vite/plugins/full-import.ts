import type { Plugin } from "vite";
import type { SharedPageItem } from "./shared/utils";
import type { PluginOption } from "./type";

function stripQuery(value: string) {
  return (value || "").split("?")[0];
}

function buildPagesDevListCode(items: SharedPageItem[]) {
  const rows = items.map((item) => {
    const name = stripQuery(item.name);
    return `{
  name: ${JSON.stringify(`./${name}`)},
  label: ${JSON.stringify(item.label)},
  component: () => import(${JSON.stringify(`@/views/${name}`)}),
}`;
  });

  return `const list = [\n${rows.join(",\n")}\n]`;
}

function injectList(code: string, generated: string) {
  const pattern = /const\s+list\s*=\s*\[\s*\]/;
  return pattern.test(code) ? code.replace(pattern, generated) : code;
}

/**
 * Keeps the historical development-page injection without rereading,
 * recompiling and evaluating the same TypeScript catalog on first request.
 */
export default function fullImportPlugin(
  option: PluginOption,
  sharedPageItems: SharedPageItem[]
): Plugin {
  const pagesDevList = buildPagesDevListCode(sharedPageItems);

  return {
    name: "fullImportElementPlus",

    transform(code, id) {
      if (option.isBuild) return null;

      if (id.includes("App.vue")) {
        const nextCode = code.replace(
          /\@import\s+\'\@jhlc\/doc\/lib\/style\.css\'\;/g,
          ""
        );
        return nextCode === code ? null : nextCode;
      }

      if (id.includes("pages-dev.ts")) {
        const nextCode = injectList(code, pagesDevList);
        return nextCode === code ? null : nextCode;
      }

      return null;
    }
  };
}
