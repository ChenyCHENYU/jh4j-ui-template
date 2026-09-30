/**
 * Element Plus Tag 组件的类型
 */
export type TagType = "" | "success" | "warning" | "danger" | "info";

/**
 * Element Plus Tag 组件的效果
 */
export type TagEffect = "light" | "dark" | "plain";

/**
 * 内置状态类型枚举（通用）。
 * 业务状态字典不要扩展此枚举，直接通过 config.ts 的
 * registerStatusConfig("yourBizStatus", [...]) 注册任意字符串键。
 */
export enum StatusType {
  /** 布尔状态（是/否） */
  BOOLEAN = "boolean",
  /** 启用/停用状态 */
  ENABLE = "enable"
}

/**
 * 状态配置项
 */
export interface StatusConfig {
  /** 状态值（用于匹配） */
  value: string | number | boolean;
  /** 显示文本 */
  label: string;
  /** Element Plus Tag 类型 */
  type?: TagType;
  /** 自定义颜色（优先级高于 type） */
  color?: string;
  /** Tag 效果 */
  effect?: TagEffect;
}

/**
 * 状态类型配置映射（string 键以支持业务注册）
 */
export type StatusTypeConfig = {
  [key: string]: StatusConfig[];
};
