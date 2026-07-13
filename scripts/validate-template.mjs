import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_NAMES = ["dev", "sit", "uat", "pre", "prd"];
const TEXT_EXTENSIONS = new Set([
  "",
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".scss",
  ".ts",
  ".vue",
  ".yaml",
  ".yml"
]);
const IGNORED_DIRECTORIES = new Set([".git", "dist", "node_modules"]);
const FORBIDDEN_CUSTOMER_MARKERS = [
  new RegExp(["wal", "sin"].join(""), "i"),
  new RegExp(["WL", "SN"].join("")),
  new RegExp(["华", "新"].join(""))
];

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, file), "utf8"));
}

function isHttpUrl(value) {
  try {
    return new Set(["http:", "https:"]).has(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function listTextFiles(directory, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const childRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTextFiles(absolute, childRelative)));
      continue;
    }
    if (
      entry.name === "pnpm-lock.yaml" ||
      !TEXT_EXTENSIONS.has(path.extname(entry.name))
    ) {
      continue;
    }
    files.push(childRelative);
  }
  return files;
}

async function main() {
  const [manifest, pkg, config, nvmrc, envFile] = await Promise.all([
    readJson("template.manifest.json"),
    readJson("package.json"),
    readJson("project.config.json"),
    readFile(path.join(root, ".nvmrc"), "utf8"),
    readFile(path.join(root, ".env"), "utf8")
  ]);
  const errors = [];

  if (pkg.name !== "jh4j-ui-template") {
    errors.push(`package.json name 应为 jh4j-ui-template，实际为 ${pkg.name}`);
  }
  if (pkg.version !== manifest.version) {
    errors.push("package.json 与 template.manifest.json 版本不一致");
  }
  if (pkg.engines?.node !== manifest.runtime?.node) {
    errors.push("Node 版本约束未与模板 manifest 对齐");
  }
  if (pkg.packageManager !== manifest.runtime?.packageManager) {
    errors.push("pnpm 版本未与模板 manifest 对齐");
  }
  if (nvmrc.trim() !== manifest.runtime?.recommendedNode) {
    errors.push(".nvmrc 未与推荐 Node 版本对齐");
  }
  if (config.projectName !== pkg.name) {
    errors.push("project.config.json 的 projectName 未与 package.json 对齐");
  }
  if (!existsSync(path.join(root, "src", "views", config.moduleName))) {
    errors.push(`缺少模板业务目录 src/views/${config.moduleName}`);
  }

  for (const env of ENV_NAMES) {
    const item = config.environments?.[env];
    if (!item || !isHttpUrl(item.webUrl) || !item.apiPrefix) {
      errors.push(`${env.toUpperCase()} 环境配置不完整`);
    }
  }

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*)=(.+)$/);
    if (match?.[2]?.trim()) {
      errors.push(`.env 中不允许保存敏感值: ${match[1]}`);
    }
  }

  for (const file of await listTextFiles(root)) {
    const content = await readFile(path.join(root, file), "utf8");
    if (FORBIDDEN_CUSTOMER_MARKERS.some((pattern) => pattern.test(content))) {
      errors.push(`发现客户专属标识: ${file}`);
    }
  }

  if (errors.length) {
    console.error("模板契约校验失败：");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    `模板契约校验通过：${manifest.id}@${manifest.version}，Node ${manifest.runtime.node}`
  );
}

main().catch((error) => {
  console.error(`模板契约校验异常: ${error.message}`);
  process.exitCode = 1;
});
