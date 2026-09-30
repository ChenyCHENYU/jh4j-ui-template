import type { StatusTypeConfig, StatusConfig } from "./types";
import { StatusType } from "./types";

/**
 * 状态配置映射表 —— 配置驱动的状态标签中心
 *
 * 使用说明：
 * 1. value: 后端返回的状态值（字符串/数字/布尔值）
 * 2. label: 前端显示的文本
 * 3. type: Element Plus Tag 类型（success/warning/danger/info/''）
 * 4. color: 自定义颜色（可选，优先级高于 type）
 * 5. effect: Tag 效果（light/dark/plain，默认 light）
 *
 * 模板只内置两个通用字典（boolean / enable）；业务项目的状态字典
 * 统一在入口或模块初始化时调用 registerStatusConfig() 注册，例如：
 *
 *   registerStatusConfig("orderStatus", [
 *     { value: "0", label: "待处理", type: "info" },
 *     { value: "1", label: "处理中", type: "warning" },
 *     { value: "2", label: "已完成", type: "success" },
 *     { value: "3", label: "已驳回", type: "danger" }
 *   ]);
 *
 * 页面中使用：<C_TagStatus type="orderStatus" :value="row.status" />
 */
export const STATUS_CONFIG: StatusTypeConfig = {
  /** 布尔状态（是/否），兼容 boolean/01/YN 多种后端形态 */
  [StatusType.BOOLEAN]: [
    { value: true, label: "是", type: "success" },
    { value: false, label: "否", type: "info" },
    { value: 1, label: "是", type: "success" },
    { value: 0, label: "否", type: "info" },
    { value: "1", label: "是", type: "success" },
    { value: "0", label: "否", type: "info" },
    { value: "Y", label: "是", type: "success" },
    { value: "N", label: "否", type: "info" }
  ],

  /** 启用/停用状态 */
  [StatusType.ENABLE]: [
    { value: "0", label: "已启用", type: "success" },
    { value: "1", label: "已停用", type: "danger" },
    { value: 0, label: "已启用", type: "success" },
    { value: 1, label: "已停用", type: "danger" }
  ]
};

/**
 * 获取状态配置
 * @param statusType 状态类型
 * @param value 状态值
 * @returns 状态配置对象
 */
export function getStatusConfig(
  statusType: StatusType | string,
  value: string | number | boolean | null | undefined
): StatusConfig | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const configs = STATUS_CONFIG[statusType as string];
  if (!configs) {
    return undefined;
  }

  // 精确匹配
  let config = configs.find((c) => c.value === value);

  // 如果精确匹配失败，尝试字符串化后匹配
  if (!config) {
    const valueStr = String(value);
    config = configs.find((c) => String(c.value) === valueStr);
  }

  return config;
}

/**
 * 获取状态显示文本
 * @param statusType 状态类型
 * @param value 状态值
 * @returns 显示文本
 */
export function getStatusLabel(
  statusType: StatusType | string,
  value: string | number | boolean | null | undefined
): string {
  const config = getStatusConfig(statusType, value);
  return config?.label || String(value || "-");
}

/**
 * 批量注册新的状态配置（业务字典的统一入口）
 * @param statusType 状态类型（任意字符串键）
 * @param configs 状态配置数组
 */
export function registerStatusConfig(
  statusType: string,
  configs: StatusConfig[]
): void {
  STATUS_CONFIG[statusType] = configs;
}
