import { execFileSync } from "node:child_process";

/**
 * 发布环境防串线闸门（自 wl-ui-public 的 build-environment-guard 精简移植）。
 *
 * 背景：某子应用 SIT 分支的默认 build 被误改为 `--mode prod`，流水线忠实
 * 执行导致 SIT 包打到 PRD。规范定案：分支名与环境必须一致，构建前强校验。
 *
 * 规则：
 * 1. vite --mode 必须是受支持的环境（dev/sit/uat/pre/prd）；
 * 2. 在标准环境分支上（dev/sit/uat/pre/prd/prod），分支名必须与构建目标
 *    一致，不一致直接抛错终止构建；
 * 3. 功能分支不强行绑定环境（可从 feature 分支出测试包），但会明确打印
 *    本次构建目标，避免误操作无感知。
 */

const ENVIRONMENTS = new Set(["dev", "sit", "uat", "pre", "prd"]);

export type BuildEnvironment = "dev" | "sit" | "uat" | "pre" | "prd";

function normalizeBuildEnvironment(value: string): BuildEnvironment {
  const normalized = value.trim().toLowerCase();
  if (normalized === "prod") return "prd";
  if (!ENVIRONMENTS.has(normalized)) {
    throw new Error(
      `[env-guard] 不支持的构建环境 "${value}"。可用：${[...ENVIRONMENTS].join(", ")}`
    );
  }
  return normalized as BuildEnvironment;
}

function normalizeBranchName(value: string): string {
  return value
    .trim()
    .replace(/^refs\/heads\//, "")
    .replace(/^refs\/remotes\/origin\//, "")
    .replace(/^origin\//, "");
}

function environmentFromBranch(value?: string): BuildEnvironment | null {
  if (!value) return null;
  const branch = normalizeBranchName(value);
  if (branch === "prod") return "prd";
  return ENVIRONMENTS.has(branch) ? (branch as BuildEnvironment) : null;
}

function readGitBranch(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function detectEnvironmentBranch(): {
  branch: string;
  environment: BuildEnvironment;
} | null {
  // CI 提供的分支变量优先级高于本地 Git，且只采用第一个有效值，
  // 避免 Jenkins/GitLab 同时残留多个变量时误判成另一环境。
  const ciBranch = [
    process.env.CI_COMMIT_REF_NAME,
    process.env.CI_COMMIT_BRANCH,
    process.env.BRANCH_NAME,
    process.env.GIT_LOCAL_BRANCH,
    process.env.GIT_BRANCH
  ].find((candidate) => candidate?.trim());

  const branch = ciBranch || readGitBranch();
  const environment = environmentFromBranch(branch || undefined);
  return branch && environment
    ? { branch: normalizeBranchName(branch), environment }
    : null;
}

export interface BuildEnvironmentGuardOptions {
  /** vite --mode 参数（configEnv.mode） */
  mode: string;
}

export function assertBuildEnvironment({
  mode
}: BuildEnvironmentGuardOptions): BuildEnvironment {
  const modeEnvironment = normalizeBuildEnvironment(mode);

  const branchInfo = detectEnvironmentBranch();
  if (branchInfo && branchInfo.environment !== modeEnvironment) {
    throw new Error(
      `[env-guard] 当前分支 ${branchInfo.branch} 不允许构建 ${modeEnvironment} 环境。` +
        `请执行 pnpm build:${branchInfo.environment}。`
    );
  }

  if (branchInfo) {
    console.log(
      `[env-guard] 分支 ${branchInfo.branch}，构建环境 ${modeEnvironment}，校验通过。`
    );
  } else {
    console.warn(
      `[env-guard] 当前为非环境分支或无法识别分支；本次明确构建 ${modeEnvironment} 环境。`
    );
  }

  return modeEnvironment;
}
