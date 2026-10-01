import { computed, reactive, ref } from "vue";
import { defineColumns, renderTagNode } from "@agile-team/wl-skills-ui/runtime";
import { BusLogicDataType, type TableColumnDesc } from "@/types/page";
import { STATUS_MAP, type DemoOrder } from "../list/data";

/**
 * 示例左树右表页（tree-list 骨架示范）：
 * - 结构遵循 tree-list SKILL：__aside 左树 + 拖拽分割条 + __main 右表
 * - 左树使用内置 C_Tree 组件（Tab + 关键词过滤），点击节点过滤右表
 * - 右表复用 list-page 的表格规范（BaseTable + AG Grid + cid）
 * - 数据为本地静态数组，真实项目把 fetchOrders 替换为 API 调用即可
 */

export interface DemoTreeNode {
  id: string;
  label: string;
  factory?: string;
  children?: DemoTreeNode[];
}

export const TREE_CID = "tpl001-demo-tree-list";

const TREE_DATA: DemoTreeNode[] = [
  {
    id: "all",
    label: "全部工厂"
  },
  {
    id: "f1",
    label: "示例工厂一",
    children: [
      { id: "f1-a", label: "一车间", factory: "示例工厂一" },
      { id: "f1-b", label: "二车间", factory: "示例工厂一" }
    ]
  },
  {
    id: "f2",
    label: "示例工厂二",
    children: [
      { id: "f2-a", label: "一车间", factory: "示例工厂二" },
      { id: "f2-b", label: "二车间", factory: "示例工厂二" }
    ]
  },
  {
    id: "f3",
    label: "示例工厂三",
    children: [{ id: "f3-a", label: "一车间", factory: "示例工厂三" }]
  }
];

const SEED_ORDERS: DemoOrder[] = [
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
    weight: 88,
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

export function useDemoTreeListPage() {
  const activeFactory = ref<string>("");
  const page = reactive({ current: 1, size: 10, total: 0 });

  const filtered = computed(() =>
    activeFactory.value
      ? SEED_ORDERS.filter((row) => row.factoryName === activeFactory.value)
      : [...SEED_ORDERS]
  );

  const paged = computed(() => {
    const start = (page.current - 1) * page.size;
    return filtered.value.slice(start, start + page.size);
  });

  function refreshPageMeta() {
    page.total = filtered.value.length;
    const maxPage = Math.max(1, Math.ceil(page.total / page.size));
    if (page.current > maxPage) page.current = maxPage;
  }

  function handleNodeClick(node: DemoTreeNode) {
    // 父节点（无 factory 字段）代表全部；叶子节点按工厂过滤
    activeFactory.value = node.factory ?? "";
    page.current = 1;
    refreshPageMeta();
  }

  function changePage(current: number) {
    page.current = current;
  }

  refreshPageMeta();

  return {
    treeData: TREE_DATA,
    activeFactory,
    page,
    paged,
    handleNodeClick,
    changePage
  };
}

export function columnsDef(): TableColumnDesc[] {
  return defineColumns([
    {
      name: "orderNo",
      label: "订单编号",
      cid: `${TREE_CID}-orderNo`,
      minWidth: 160
    },
    {
      name: "materialName",
      label: "物料名称",
      cid: `${TREE_CID}-materialName`,
      minWidth: 140
    },
    {
      name: "factoryName",
      label: "工厂",
      cid: `${TREE_CID}-factoryName`,
      minWidth: 130
    },
    {
      name: "quantity",
      label: "数量",
      cid: `${TREE_CID}-quantity`,
      minWidth: 100,
      logicType: BusLogicDataType.number
    },
    {
      name: "weight",
      label: "重量",
      cid: `${TREE_CID}-weight`,
      minWidth: 100,
      logicType: BusLogicDataType.number
    },
    {
      name: "status",
      label: "状态",
      cid: `${TREE_CID}-status`,
      minWidth: 100,
      defaultNode: ({ row }: { row: DemoOrder }) =>
        renderTagNode(row.status, STATUS_MAP)
    },
    {
      name: "createDate",
      label: "创建日期",
      cid: `${TREE_CID}-createDate`,
      minWidth: 130
    }
  ] as never[]) as TableColumnDesc[];
}
