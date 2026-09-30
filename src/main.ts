import "reflect-metadata";
import "virtual:svg-icons-register";
// wl-skills-ui 运行时守卫：未经 defineColumns() 的动态普通文本列
// 提供真实溢出省略兜底，并做样式对齐校验。
import "@agile-team/wl-skills-ui/runtime/auto";
import { publicEnvReady } from "@/util/public-env";

// 环境以 wl-ui-public 部署的 env.json 为准：等预载完成后才加载主链路，
// 保证 axios.create 等模块顶层求值拿到的已是 public 下发的环境。
// dev 下 publicEnvReady 立即完成，使用本地 vite 上下文的兜底值。
await publicEnvReady;
const { default: MainCore } = await import("./main-core");

MainCore();
