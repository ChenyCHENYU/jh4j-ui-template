import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

interface BuildArtifactsPluginOptions {
  filename: string;
  getPageNum: () => number;
  moduleName: string;
  outputDirectory: string;
  version: string;
}

const TRADITIONAL_COPY_IGNORE = [
  "_vue-router",
  "x6.",
  "x6-vue-shape.",
  "_shared_vue.",
  "_commonjsHelpers.",
  "_element-plus.",
  "_shared_pinia."
];

function formatBuildTime(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function createVersionSource(options: BuildArtifactsPluginOptions) {
  const namespace = options.moduleName || "main";

  // Keep the platform's historical version.js protocol byte-for-byte compatible.
  return `// Auto-generated version file
window.${namespace}_entry = "${options.filename}";
window.${namespace}_vd = "${options.version}";
window.${namespace}_packEndTime = "${formatBuildTime(new Date())}";
window.${namespace}_pageNum = "${options.getPageNum()}";
`;
}

function getTraditionalFilename(filename: string) {
  return filename === "index.html"
    ? "index-tw.html"
    : filename.replace(/\.js$/, "-tw.js");
}

function rewriteTraditionalReferences(content: string) {
  return content
    .replace(/-(1\d{12})\.js/g, "-$1-tw.js")
    .replace(/version\.js/g, "version-tw.js")
    .replace(/remoteEntry\.js/g, "remoteEntry-tw.js");
}

async function createTraditionalCopies(directory: string) {
  // Build-only capability: do not load the OpenCC dictionaries in dev/config
  // startup, where no Traditional Chinese files are emitted.
  const OpenCC = await import("opencc-js");
  const convertToTraditional = OpenCC.Converter({ from: "cn", to: "tw" });

  const visit = (currentDirectory: string) => {
    for (const entry of fs.readdirSync(currentDirectory, {
      withFileTypes: true
    })) {
      const filePath = path.resolve(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }

      if (
        (!entry.name.endsWith(".js") && entry.name !== "index.html") ||
        entry.name.endsWith("-tw.js")
      ) {
        continue;
      }

      const isIgnored = TRADITIONAL_COPY_IGNORE.some((fragment) =>
        entry.name.includes(fragment)
      );
      let content = fs.readFileSync(filePath, "utf8");

      // Preserve the retired plugin's conversion boundary: translate business
      // chunks and copy framework/vendor chunks without changing their content.
      if (
        !isIgnored &&
        entry.name.startsWith("src-") &&
        /[\u4e00-\u9fa5]/.test(content)
      ) {
        content = convertToTraditional(content);
      }
      if (!isIgnored) {
        content = rewriteTraditionalReferences(content);
      }

      fs.writeFileSync(
        path.resolve(currentDirectory, getTraditionalFilename(entry.name)),
        content
      );
    }
  };

  visit(directory);
}

/**
 * Own the two build capabilities that used to come from @jhlc/common-vite-plugin.
 * This removes its Vite 4 peer lock and undeclared opencc-js dependency while
 * preserving the version protocol and Traditional Chinese files.
 */
export function createBuildArtifactsPlugin(
  options: BuildArtifactsPluginOptions
): Plugin {
  return {
    name: "wl:build-artifacts",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.js",
        source: createVersionSource(options)
      });
    },
    async closeBundle() {
      const startedAt = performance.now();
      await createTraditionalCopies(options.outputDirectory);
      console.log(
        `[build-artifacts] Traditional Chinese copies completed in ${(
          (performance.now() - startedAt) /
          1000
        ).toFixed(2)}s`
      );
    }
  };
}
