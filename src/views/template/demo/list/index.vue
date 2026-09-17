<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  columnsDef,
  createDemoOrderForm,
  queryDef,
  toolbarDef,
  useDemoListPage,
  STATUS_MAP,
  type DemoOrder
} from "./data";

/**
 * 示例列表页（标准规范示范）：
 * - 结构遵循 list-page 骨架：搜索区 → 工具栏 → 列表标题 → 表格 → 分页
 * - 表格使用平台 BaseTable（AG Grid 渲染 + cid 列持久化）
 * - 列定义经 defineColumns() 包裹，状态列 renderTagNode，操作列 renderOps
 * - 数据为本地静态数组，真实项目替换为 API 调用（见 data.ts 与 api.md）
 *
 * BaseQuery / BaseToolbar / BaseTable / jh-pagination 由平台 public 的
 * plugins 在运行时全局注册，无需 import（与生产项目写法一致）。
 */
const {
  query,
  page,
  paged,
  handleSearch,
  handleReset,
  changePage,
  changePageSize,
  saveOrder,
  deleteOrder
} = useDemoListPage();

const detailVisible = ref(false);
const viewRow = ref<DemoOrder>();
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const form = ref(createDemoOrderForm());
const formRules: FormRules = {
  orderNo: [{ required: true, message: "请输入订单编号", trigger: "blur" }],
  materialName: [{ required: true, message: "请输入物料名称", trigger: "blur" }]
};

const columns = computed(() =>
  columnsDef({
    onView: (row) => {
      viewRow.value = row;
      detailVisible.value = true;
    },
    onEdit: (row) => {
      form.value = createDemoOrderForm(row);
      dialogVisible.value = true;
    },
    onDelete: (row) => {
      deleteOrder(row);
    }
  })
);

const toolbars = computed(() =>
  toolbarDef({
    onAdd: () => {
      form.value = createDemoOrderForm();
      dialogVisible.value = true;
    }
  })
);

const dialogTitle = computed(() => (form.value.id ? "编辑订单" : "新增订单"));

async function handleSubmit() {
  if (formRef.value) {
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;
  }
  if (saveOrder(form.value)) {
    dialogVisible.value = false;
  }
}
</script>

<template>
  <div class="list-page demo-list">
    <div class="list-page__query">
      <BaseQuery
        :form="query"
        :items="queryDef()"
        :columns="4"
        :auto-select="false"
        @select="handleSearch"
        @reset="handleReset"
      />
    </div>

    <div class="list-page__toolbar">
      <BaseToolbar :items="toolbars" />
    </div>

    <div class="list-page__title">示例订单列表</div>

    <div class="list-page__table">
      <BaseTable
        cid="tpl001-demo-list"
        :data="paged"
        :columns="columns"
        row-key="id"
        render-type="agGrid"
        show-toolbar
        highlight-current-row
        empty-text="暂无数据"
      />
    </div>

    <div class="list-page__pagination">
      <jh-pagination
        v-show="page.total > 0"
        v-model:currentPage="page.current"
        v-model:pageSize="page.size"
        :total="page.total"
        @current-change="changePage"
        @size-change="changePageSize"
      />
    </div>

    <!-- 详情抽屉：只读展示示范（drawer-detail 模式） -->
    <el-drawer v-model="detailVisible" :size="480" title="订单详情">
      <template v-if="viewRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">
            {{ viewRow.orderNo }}
          </el-descriptions-item>
          <el-descriptions-item label="物料名称">
            {{ viewRow.materialName }}
          </el-descriptions-item>
          <el-descriptions-item label="工厂">
            {{ viewRow.factoryName }}
          </el-descriptions-item>
          <el-descriptions-item label="数量">
            {{ viewRow.quantity }}
          </el-descriptions-item>
          <el-descriptions-item label="重量（吨）">
            {{ viewRow.weight }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="STATUS_MAP[viewRow.status].type" size="small">
              {{ STATUS_MAP[viewRow.status].label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建日期">
            {{ viewRow.createDate }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 新增/编辑弹窗（form-dialog 模式：optr 三态中的 add/edit） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="订单编号" prop="orderNo">
          <el-input
            v-model="form.orderNo"
            size="small"
            placeholder="请输入订单编号"
          />
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input
            v-model="form.materialName"
            size="small"
            placeholder="请输入物料名称"
          />
        </el-form-item>
        <el-form-item label="工厂" prop="factoryName">
          <el-input
            v-model="form.factoryName"
            size="small"
            placeholder="请输入工厂"
          />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="form.quantity"
            size="small"
            :min="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="重量（吨）" prop="weight">
          <el-input-number
            v-model="form.weight"
            size="small"
            :min="0"
            :precision="2"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="form.status"
            size="small"
            placeholder="请选择状态"
          >
            <el-option
              v-for="(status, key) in STATUS_MAP"
              :key="key"
              :label="status.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期" prop="createDate">
          <el-date-picker
            v-model="form.createDate"
            type="date"
            size="small"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
