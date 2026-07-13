/**
 * 页面常用类型统一导出
 * 业务页面统一通过 import { xxx } from "@/types/page" 引入
 */

// 页面 Hook
export { AbstractPageQueryHook } from "@jhlc/common-core/src/page-hooks/page-query-hook";

// 查询组件类型
export { BaseQueryItemDesc } from "@jhlc/common-core/src/components/form/base-query/type";

// 工具栏类型
export { ActionButtonDesc } from "@jhlc/common-core/src/components/toolbar/type";

// 表格类型
export { TableColumnDesc } from "@jhlc/common-core/src/components/table/base-table/type";

// 业务逻辑数据类型
export { BusLogicDataType } from "@jhlc/types/src/logical-data";
