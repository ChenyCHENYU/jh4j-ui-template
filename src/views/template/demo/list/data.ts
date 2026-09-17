import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  defineColumns,
  renderOps,
  renderTagNode
} from "@agile-team/wl-skills-ui/runtime";
import {
  BusLogicDataType,
  type ActionButtonDesc,
  type BaseQueryItemDesc,
  type TableColumnDesc
} from "@/types/page";

/**
 * 示例列表页数据层 —— 完全使用本地静态数据，无需后端即可运行。
 * 真实业务页面把本文件中的本地数组替换为 API 调用即可
 * （参见同目录 api.md 的接口契约格式）。
 */

export interface DemoOrder {
  id: number;
  orderNo: string;
  materialName: string;
  factoryName: string;
  quantity: number;
  weight: number;
  status: "0" | "1" | "2";
  createDate: string;
}

/** AG Grid 列持久化标识：每页唯一，建议 {模块码}-{页面}-{随机段} */
export const TABLE_CID = "tpl001-demo-list";

/** 状态字典：真实项目通常来自后端字典，这里本地维护 */
export const STATUS_MAP = {
  "0": { label: "待处理", type: "info" },
  "1": { label: "处理中", type: "primary" },
  "2": { label: "已完成", type: "success" }
} as const;

const SEED_LIST: DemoOrder[] = [
  {
    id: 1,
    orderNo: "SO-20260901-001",
    materialName: "示例物料 A",
    factoryName: "示例工厂一",
    quantity: 120,
    weight: 35.5,
    status: "2",
    createDate: "2026-09-01"
  },
  {
    id: 2,
    orderNo: "SO-20260902-002",
    materialName: "示例物料 B",
    factoryName: "示例工厂二",
    quantity: 80,
    weight: 21.2,
    status: "1",
    createDate: "2026-09-02"
  },
  {
    id: 3,
    orderNo: "SO-20260903-003",
    materialName: "示例物料 C",
    factoryName: "示例工厂一",
    quantity: 260,
    weight: 88.0,
    status: "0",
    createDate: "2026-09-03"
  },
  {
    id: 4,
    orderNo: "SO-20260905-004",
    materialName: "示例物料 D",
    factoryName: "示例工厂三",
    quantity: 45,
    weight: 12.8,
    status: "1",
    createDate: "2026-09-05"
  },
  {
    id: 5,
    orderNo: "SO-20260908-005",
    materialName: "示例物料 E",
    factoryName: "示例工厂二",
    quantity: 500,
    weight: 160.4,
    status: "2",
    createDate: "2026-09-08"
  }
];

export function queryDef(): BaseQueryItemDesc[] {
  return [
    { name: "orderNo", label: "订单编号" },
    { name: "materialName", label: "物料名称" }
  ];
}

export function columnsDef(handlers: {
  onView: (row: DemoOrder) => void;
  onEdit: (row: DemoOrder) => void;
  onDelete: (row: DemoOrder) => void;
}): TableColumnDesc[] {
  return defineColumns([
    {
      name: "orderNo",
      label: "订单编号",
      cid: `${TABLE_CID}-orderNo`,
      minWidth: 160
    },
    {
      name: "materialName",
      label: "物料名称",
      cid: `${TABLE_CID}-materialName`,
      minWidth: 140
    },
    {
      name: "factoryName",
      label: "工厂",
      cid: `${TABLE_CID}-factoryName`,
      minWidth: 130
    },
    {
      name: "quantity",
      label: "数量",
      cid: `${TABLE_CID}-quantity`,
      minWidth: 100,
      logicType: BusLogicDataType.number
    },
    {
      name: "weight",
      label: "重量",
      cid: `${TABLE_CID}-weight`,
      minWidth: 100,
      logicType: BusLogicDataType.number
    },
    {
      name: "status",
      label: "状态",
      cid: `${TABLE_CID}-status`,
      minWidth: 100,
      defaultNode: ({ row }: { row: DemoOrder }) =>
        renderTagNode(row.status, STATUS_MAP)
    },
    {
      name: "createDate",
      label: "创建日期",
      cid: `${TABLE_CID}-createDate`,
      minWidth: 130
    },
    {
      label: "操作",
      cid: `${TABLE_CID}-ops`,
      width: 110,
      fixed: "right",
      defaultSlot: ({ row }: { row: DemoOrder }) =>
        renderOps([
          { type: "view", onClick: () => handlers.onView(row) },
          { type: "edit", onClick: () => handlers.onEdit(row) },
          { type: "del", onClick: () => handlers.onDelete(row) }
        ])
    }
  ] as never[]) as TableColumnDesc[];
}

export function toolbarDef(handlers: {
  onAdd: () => void;
}): ActionButtonDesc[] {
  return [
    { name: "add", type: "primary", label: "新增", onClick: handlers.onAdd }
  ];
}

export function createDemoOrderForm(record?: DemoOrder) {
  return reactive({
    id: record?.id ?? 0,
    orderNo: record?.orderNo ?? "",
    materialName: record?.materialName ?? "",
    factoryName: record?.factoryName ?? "",
    quantity: record?.quantity ?? 0,
    weight: record?.weight ?? 0,
    status: (record?.status ?? "0") as DemoOrder["status"],
    createDate: record?.createDate ?? ""
  });
}

export function useDemoListPage() {
  const list = ref<DemoOrder[]>([...SEED_LIST]);
  const query = reactive<Record<string, string>>({});
  const page = reactive({ current: 1, size: 10, total: 0 });

  const filtered = computed(() => {
    return list.value.filter((row) => {
      if (query.orderNo && !row.orderNo.includes(query.orderNo.trim())) {
        return false;
      }
      if (
        query.materialName &&
        !row.materialName.includes(query.materialName.trim())
      ) {
        return false;
      }
      return true;
    });
  });

  const paged = computed(() => {
    const start = (page.current - 1) * page.size;
    return filtered.value.slice(start, start + page.size);
  });

  function refreshPageMeta() {
    page.total = filtered.value.length;
    const maxPage = Math.max(1, Math.ceil(page.total / page.size));
    if (page.current > maxPage) page.current = maxPage;
  }

  function handleSearch() {
    page.current = 1;
    refreshPageMeta();
  }

  function handleReset() {
    Object.keys(query).forEach((key) => delete query[key]);
    handleSearch();
  }

  function changePage(current: number) {
    page.current = current;
  }

  function changePageSize(size: number) {
    page.size = size;
    page.current = 1;
  }

  function saveOrder(form: ReturnType<typeof createDemoOrderForm>) {
    if (!form.orderNo || !form.materialName) {
      ElMessage.warning("订单编号与物料名称为必填项");
      return false;
    }
    if (form.id) {
      const index = list.value.findIndex((row) => row.id === form.id);
      if (index >= 0) list.value[index] = { ...form };
      ElMessage.success("修改成功（本地演示数据）");
    } else {
      const nextId = Math.max(0, ...list.value.map((row) => row.id)) + 1;
      list.value.unshift({ ...form, id: nextId });
      ElMessage.success("新增成功（本地演示数据）");
    }
    refreshPageMeta();
    return true;
  }

  async function deleteOrder(row: DemoOrder) {
    const confirmed = await ElMessageBox.confirm(
      `确认删除订单 ${row.orderNo}？`,
      "删除确认",
      { type: "warning" }
    )
      .then(() => true)
      .catch(() => false);
    if (!confirmed) return;
    list.value = list.value.filter((item) => item.id !== row.id);
    ElMessage.success("删除成功（本地演示数据）");
    refreshPageMeta();
  }

  refreshPageMeta();

  return {
    list,
    query,
    page,
    paged,
    handleSearch,
    handleReset,
    changePage,
    changePageSize,
    saveOrder,
    deleteOrder
  };
}
