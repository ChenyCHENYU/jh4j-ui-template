import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "template.manifest.json");
const projectConfigPath = path.join(root, "project.config.json");
const packagePath = path.join(root, "package.json");
const npmrcPath = path.join(root, ".npmrc");
const readmePath = path.join(root, "README.md");

const ENV_NAMES = ["dev", "sit", "uat", "pre", "prd"];
const GIT_STANDARDS_FEATURE = "git-standards";
const GIT_STANDARDS_FILES = [
  ".cz-config.js",
  ".editorconfig",
  ".husky",
  ".prettierrc",
  "commitlint.config.js",
  "eslint.config.js",
  "pnpm-lock.yaml"
];
const GIT_STANDARDS_DEV_DEPENDENCIES = [
  "@commitlint/cli",
  "@commitlint/config-conventional",
  "@robot-admin/git-standards",
  "@typescript-eslint/eslint-plugin",
  "@typescript-eslint/parser",
  "@vue/eslint-config-prettier",
  "@vue/eslint-config-typescript",
  "commitizen",
  "cz-customizable",
  "eslint",
  "eslint-plugin-vue",
  "husky",
  "lint-staged",
  "prettier",
  "vue-eslint-parser"
];

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const [rawKey, inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }
  return options;
}

function required(value, label) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${label}不能为空`);
  return normalized;
}

function validateProjectName(value) {
  const name = required(value, "项目名称");
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error("项目名称只能包含小写字母、数字、点、下划线和连字符");
  }
  return name;
}

function validateModuleName(value) {
  const name = required(value, "模块标识");
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error("模块标识必须以小写字母开头，只能包含小写字母、数字和连字符");
  }
  return name;
}

function validatePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("开发端口必须是 1024 到 65535 之间的整数");
  }
  return port;
}

function validateUrl(value, label, { allowEmpty = false } = {}) {
  const normalized = String(value ?? "").trim();
  if (allowEmpty && !normalized) return "";
  try {
    const url = new URL(normalized);
    if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error();
    return normalized.replace(/\/+$/, "");
  } catch {
    throw new Error(`${label}必须是 http/https URL`);
  }
}

async function ask(rl, label, current) {
  const answer = await rl.question(`${label} [${current}]: `);
  return answer.trim() || current;
}

async function askBoolean(rl, label, defaultValue = false) {
  const hint = defaultValue ? "Y/n" : "y/N";
  const answer = (await rl.question(`${label} (${hint}): `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return answer === "y" || answer === "yes";
}

async function loadInputFile(file) {
  if (!file) return {};
  const resolved = path.resolve(process.cwd(), String(file));
  if (!existsSync(resolved)) throw new Error(`配置文件不存在: ${resolved}`);
  return readJson(resolved);
}

function argOrInput(options, input, argName, inputName, fallback) {
  return options[argName] ?? input[inputName] ?? fallback;
}

async function renameModuleDirectory(fromModule, toModule) {
  if (fromModule === toModule) return;

  const from = path.join(root, "src", "views", fromModule);
  const to = path.join(root, "src", "views", toModule);
  if (!existsSync(from)) return;
  if (existsSync(to)) {
    throw new Error(`无法重命名业务目录，目标已存在: src/views/${toModule}`);
  }
  await rename(from, to);
}

function buildNpmrc(npmRegistry, jhlcRegistry) {
  return `# 由 pnpm setup 或 @jhlc/jh4j-cloud-cli 根据项目配置生成。\n# pnpm 11 的非 registry 设置统一维护在 pnpm-workspace.yaml。\nregistry=${npmRegistry}/\n@jhlc:registry=${jhlcRegistry}/\n`;
}

async function removeGitStandards(pkg) {
  const next = structuredClone(pkg);
  for (const dependency of GIT_STANDARDS_DEV_DEPENDENCIES) {
    delete next.devDependencies?.[dependency];
  }
  for (const script of [
    "prepare",
    "cz",
    "lint",
    "lint:fix",
    "format",
    "format:check"
  ]) {
    delete next.scripts?.[script];
  }
  next.scripts.check = "pnpm typecheck";
  delete next["lint-staged"];
  if (next.config) {
    delete next.config.commitizen;
    if (!Object.keys(next.config).length) delete next.config;
  }
  await Promise.all(
    GIT_STANDARDS_FILES.map((file) =>
      rm(path.join(root, file), { recursive: true, force: true })
    )
  );
  return next;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`jh4j-ui-template 初始化\n\n用法:\n  pnpm setup\n  pnpm setup -- --yes --config ./project-input.json\n\n常用参数:\n  --project-name <name>\n  --module <module>\n  --title <title>\n  --port <port>\n  --npm-registry <url>\n  --jhlc-registry <url>\n  --local-backend <url>\n  --local-public <url>\n  --no-standards\n  --config <json-file>\n  --configure-environments\n  --created-by <source>\n  --yes`);
    return;
  }

  const [manifest, projectConfig, pkg, input] = await Promise.all([
    readJson(manifestPath),
    readJson(projectConfigPath),
    readJson(packagePath),
    loadInputFile(options.config)
  ]);

  const interactive = process.stdin.isTTY && process.stdout.isTTY && !options.yes;
  const rl = interactive
    ? createInterface({ input: process.stdin, output: process.stdout })
    : null;

  try {
    const directoryName = path.basename(root).toLowerCase();
    const inferredProjectName = /^[a-z0-9][a-z0-9._-]*$/.test(directoryName)
      ? directoryName
      : projectConfig.projectName;
    const defaultProjectName =
      projectConfig.projectName === "jh4j-ui-template"
        ? inferredProjectName
        : projectConfig.projectName;
    let projectName = argOrInput(
      options,
      input,
      "project-name",
      "projectName",
      defaultProjectName
    );
    let moduleName = argOrInput(
      options,
      input,
      "module",
      "moduleName",
      projectConfig.moduleName
    );
    let title = argOrInput(options, input, "title", "title", projectConfig.title);
    let port = argOrInput(
      options,
      input,
      "port",
      "devServerPort",
      projectConfig.devServerPort
    );
    let npmRegistry = argOrInput(
      options,
      input,
      "npm-registry",
      "npmRegistry",
      manifest.defaults.npmRegistry
    );
    let jhlcRegistry = argOrInput(
      options,
      input,
      "jhlc-registry",
      "jhlcRegistry",
      manifest.defaults.jhlcRegistry
    );
    let localBackendUrl = argOrInput(
      options,
      input,
      "local-backend",
      "localBackendUrl",
      projectConfig.localBackendUrl
    );
    let localPublicUrl = argOrInput(
      options,
      input,
      "local-public",
      "localPublicUrl",
      projectConfig.localPublicUrl
    );
    let features = Array.isArray(input.features)
      ? [...input.features]
      : Array.isArray(projectConfig.features)
        ? [...projectConfig.features]
        : (manifest.features ?? [])
            .filter((feature) => feature.defaultEnabled || feature.required)
            .map((feature) => feature.id);
    if (options["no-standards"]) {
      features = features.filter((feature) => feature !== GIT_STANDARDS_FEATURE);
    }

    if (interactive) {
      console.log("\nJH4J PC 模板初始化。直接回车即可接受当前默认值。\n");
      projectName = await ask(rl, "项目名称", projectName);
      moduleName = await ask(rl, "模块标识", moduleName);
      title = await ask(rl, "系统标题", title);
      port = await ask(rl, "开发端口", port);
      npmRegistry = await ask(rl, "npm registry", npmRegistry);
      jhlcRegistry = await ask(rl, "@jhlc 私有 registry", jhlcRegistry);
      localBackendUrl = await ask(rl, "本地后端地址", localBackendUrl);
      localPublicUrl = await ask(rl, "本地 public 地址", localPublicUrl);
      const useGitStandards = await askBoolean(
        rl,
        "是否启用完整 Git 与代码质量规范",
        features.includes(GIT_STANDARDS_FEATURE)
      );
      features = useGitStandards
        ? [...new Set([...features, GIT_STANDARDS_FEATURE])]
        : features.filter((feature) => feature !== GIT_STANDARDS_FEATURE);
    }

    projectName = validateProjectName(projectName);
    moduleName = validateModuleName(moduleName);
    title = required(title, "系统标题");
    port = validatePort(port);
    npmRegistry = validateUrl(npmRegistry, "npm registry");
    jhlcRegistry = validateUrl(jhlcRegistry, "@jhlc 私有 registry");
    localBackendUrl = validateUrl(localBackendUrl, "本地后端地址");
    localPublicUrl = validateUrl(localPublicUrl, "本地 public 地址");

    const projectInput = { ...input };
    delete projectInput.npmRegistry;
    delete projectInput.jhlcRegistry;

    const nextConfig = {
      ...projectConfig,
      ...projectInput,
      projectName,
      moduleName,
      title,
      devServerPort: port,
      localBackendUrl,
      localPublicUrl,
      features,
      environments: {
        ...projectConfig.environments,
        ...(input.environments ?? {})
      }
    };

    const configureEnvironments =
      options["configure-environments"] ||
      ENV_NAMES.some(
        (env) => options[`${env}-url`] || options[`${env}-api-prefix`]
      ) ||
      (interactive && (await askBoolean(rl, "是否逐项确认五套环境地址", false)));

    for (const env of ENV_NAMES) {
      const current = nextConfig.environments[env];
      if (!current) throw new Error(`缺少 ${env} 环境配置`);

      let webUrl = options[`${env}-url`] ?? current.webUrl;
      let apiPrefix = options[`${env}-api-prefix`] ?? current.apiPrefix;
      if (interactive && configureEnvironments) {
        webUrl = await ask(rl, `${env.toUpperCase()} 平台地址`, webUrl);
        apiPrefix = await ask(rl, `${env.toUpperCase()} API 前缀`, apiPrefix);
      }
      nextConfig.environments[env] = {
        webUrl: validateUrl(webUrl, `${env.toUpperCase()} 平台地址`),
        apiPrefix: required(apiPrefix, `${env.toUpperCase()} API 前缀`).replace(
          /^\/+|\/+$/g,
          ""
        )
      };
    }

    const oldModuleName = projectConfig.moduleName;
    await renameModuleDirectory(oldModuleName, moduleName);
    await writeJson(projectConfigPath, nextConfig);
    const nextPackage = features.includes(GIT_STANDARDS_FEATURE)
      ? { ...pkg, name: projectName }
      : { ...(await removeGitStandards(pkg)), name: projectName };
    await writeJson(packagePath, nextPackage);
    await writeFile(npmrcPath, buildNpmrc(npmRegistry, jhlcRegistry), "utf8");
    if (existsSync(readmePath)) {
      const readme = await readFile(readmePath, "utf8");
      await writeFile(
        readmePath,
        readme.replace(/^# .+$/m, `# ${projectName}`),
        "utf8"
      );
    }

    const metadataDir = path.join(root, ".jhlc");
    await mkdir(metadataDir, { recursive: true });
    await writeJson(path.join(metadataDir, "project.json"), {
      schemaVersion: 1,
      template: { id: manifest.id, version: manifest.version },
      platformVersion: null,
      createdAt: new Date().toISOString(),
      createdBy: String(options["created-by"] || "git-clone"),
      parameters: {
        projectName,
        moduleName,
        title,
        devServerPort: port,
        localBackendUrl,
        localPublicUrl,
        features
      }
    });

    console.log("\n初始化完成：");
    console.log(`  项目名称: ${projectName}`);
    console.log(`  模块标识: ${moduleName}`);
    console.log(`  系统标题: ${title}`);
    console.log(`  开发端口: ${port}`);
    console.log(
      `  标准能力: ${features.length ? features.join(", ") : "未启用"}`
    );
    console.log("\n下一步：pnpm install && pnpm dev\n");
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  console.error(`\n初始化失败: ${error.message}\n`);
  process.exitCode = 1;
});
