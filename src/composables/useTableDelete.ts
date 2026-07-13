/*
 * @Description: 表格删除操作 Composable
 */
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteAction } from "@jhlc/common-core/src/api/action";

/**
 * 表格删除操作
 * @param url - 删除接口地址
 * @returns 删除处理函数
 */
export function useTableDelete(url: string) {
  return async (options: {
    batch?: boolean;
    params?: any;
    data?: any;
    tipOptions?: {
      confirmMsg?: string;
      confirmTitle?: string;
      successMsg?: string;
    };
    onSuccess?: () => void;
  }) => {
    const { params, data, batch, tipOptions, onSuccess } = options;

    if (batch && (!data || data.length === 0)) {
      ElMessage.warning("请先选择要删除的数据");
      return;
    }

    // 删除确认提示
    await ElMessageBox.confirm(
      tipOptions?.confirmMsg || "删除后不可恢复，确认继续吗？",
      tipOptions?.confirmTitle ||
        `确定删除${batch ? `选中的${data.length}条数据` : "当前数据"}?`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    // 执行删除
    const res = await deleteAction(url, params, data);

    // 成功提示
    ElMessage.success(tipOptions?.successMsg || res.message || "删除成功");

    // 刷新列表
    onSuccess?.();

    return res;
  };
}
