<template>
  <jh-dialog
    v-model="visible"
    :width="width"
    :title="currentTitle"
    modal-class="c-form-modal"
  >
    <BaseForm
      ref="formRef"
      :form="form"
      :items="formItems"
      :columns="columns"
      :label-width="labelWidth"
      :disabled="mode === 'view'"
    />
    <template #footer>
      <div class="c-form-modal__footer">
        <el-button
          v-if="listPicker && mode !== 'view'"
          type="primary"
          plain
          data-testid="c-form-modal-list-picker"
          @click="openListPicker"
        >
          {{ listPicker.buttonLabel || "选择" }}
        </el-button>
        <el-button
          v-if="showTestFill"
          class="c-form-modal__test-fill"
          data-testid="c-form-modal-test-fill"
          @click="fillTestData"
        >
          填充测试数据
        </el-button>
        <BaseToolbar :items="footerActions" />
      </div>
    </template>
    <CListModal
      v-if="listPicker"
      ref="listPickerRef"
      :title="listPicker.title"
      :api-path="listPicker.apiPath"
      :request-method="pickerRequestMethod"
      :query-items="listPicker.queryItems"
      :table-columns="listPicker.tableColumns"
      selection-mode="single"
      :require-selection="true"
      :selection-validator="listPicker.validateSelection"
      @ok="handleListPickerOk"
    />
  </jh-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import cloneDeep from "lodash-es/cloneDeep";
import type { BaseFormItemDesc } from "@jhlc/common-core/src/components/form/common/type";
import type { BaseQueryItemDesc, TableColumnDesc } from "@/types/page";
import type { ActionButtonDesc } from "@/types/page";
import { RequestMethod } from "@jhlc/types/src/request-type";
import { postAction, putAction } from "@jhlc/common-core/src/api/action";
import CListModal from "@/components/local/c_listModal/index.vue";

/** 列表选择器配置；选中行经 map 回填表单字段。 */
interface ListPickerOption {
  title?: string;
  buttonLabel?: string;
  apiPath: string;
  requestMethod?: "get" | "post" | "put" | "delete";
  queryItems?: BaseQueryItemDesc[];
  tableColumns?: TableColumnDesc[];
  requestParams?: (context: Record<string, unknown>) => Record<string, unknown>;
  validateContext?: (context: Record<string, unknown>) => string | undefined;
  validateSelection?: (row: Record<string, unknown>) => string | undefined;
  map?: (row: Record<string, unknown>) => Record<string, unknown>;
}

interface ModalApi {
  save: string;
  update: string;
}

type FormMode = "add" | "edit" | "view";

interface Props {
  formItems: BaseFormItemDesc[];
  api: ModalApi;
  rowKey?: string;
  width?: string;
  columns?: number;
  labelWidth?: string;
  titlePrefix?: string;
  title?: string;
  submitLabel?: string;
  submitType?: "primary" | "danger";
  updateMethod?: "post" | "put";
  transformSubmit?: (
    value: Record<string, unknown>,
    mode: Exclude<FormMode, "view">
  ) => Record<string, unknown>;
  transformInitialValue?: (
    value: Record<string, unknown>
  ) => Record<string, unknown>;
  /** 仅生成浏览器表单值，不得在回调内发请求或自动提交。 */
  testFill?: (value: Record<string, unknown>) => Record<string, unknown>;
  /** 可选：新增/编辑态显示"列表选择"按钮，选中后按 map 回填表单字段。 */
  listPicker?: ListPickerOption;
  /** 页面级只读上下文，例如主从页面当前炉次的厂别。 */
  listPickerContext?: Record<string, unknown>;
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: "id",
  width: "960px",
  columns: 3,
  labelWidth: "118px",
  titlePrefix: "数据",
  listPickerContext: () => ({})
});
const emit = defineEmits<{ (event: "ok"): void }>();

const visible = ref(false);
const saving = ref(false);
const formRef = ref();
const form = ref<Record<string, unknown>>({});
const mode = ref<FormMode>("add");
const showTestFill = computed(
  () =>
    ["dev", "sit"].includes(import.meta.env.MODE) &&
    mode.value !== "view" &&
    typeof props.testFill === "function"
);

/**
 * 表单由 ref 深度响应式代理，不能直接交给 structuredClone。
 * cloneDeep 会按值读取代理并产出普通对象，确保弹窗初始化和提交使用独立快照。
 */
const cloneFormValue = (value: Record<string, unknown>) => cloneDeep(value);

const formErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message.trim() : "";
  return /[\u3400-\u9fff]/u.test(message) && message.length <= 120
    ? message
    : "表单数据处理失败，请关闭弹窗后重新打开再试";
};

const currentTitle = computed(
  () =>
    props.title ||
    `${{ add: "新增", edit: "编辑", view: "查看" }[mode.value]}${props.titlePrefix}`
);

const close = () => {
  visible.value = false;
};

const fillTestData = () => {
  if (!props.testFill) return;
  const current = cloneFormValue(form.value);
  form.value = { ...current, ...props.testFill(current) };
  ElMessage.success("测试数据已填入，请核对后手动保存");
};

const listPickerRef = ref<InstanceType<typeof CListModal>>();
const openListPicker = () => {
  const picker = props.listPicker;
  if (!picker) return;
  const context = {
    ...props.listPickerContext,
    ...cloneFormValue(form.value)
  };
  const message = picker.validateContext?.(context);
  if (message) {
    ElMessage.warning(message);
    return;
  }
  listPickerRef.value?.open(picker.requestParams?.(context) || {});
};

/** 配置使用纯字符串（契约脚本可加载），这里换算为 c_listModal 需要的枚举。 */
const enumRequestMethod = RequestMethod as unknown as Record<
  string,
  RequestMethod
>;
const pickerRequestMethod = computed(
  () => enumRequestMethod[props.listPicker?.requestMethod || "post"]
);

/**
 * c_listModal 确认返回单元素数组、双击返回单行；两种来源统一取唯一行。
 * 回填走与"填充测试数据"相同的表单赋值路径，不触碰校验与提交结构。
 */
const handleListPickerOk = (rows: unknown) => {
  const selected = Array.isArray(rows) ? rows : [rows];
  if (selected.length !== 1) {
    ElMessage.warning("当前只能选择一条数据");
    return;
  }
  const row = selected[0] as Record<string, unknown> | undefined;
  if (!row) return;
  const message = props.listPicker?.validateSelection?.(row);
  if (message) {
    ElMessage.warning(message);
    return;
  }
  const mapped = props.listPicker?.map?.(row) || {};
  form.value = { ...cloneFormValue(form.value), ...mapped };
  ElMessage.success("已带入所选数据，请核对后保存");
};

const save = async () => {
  const valid = await new Promise<boolean>((resolve) => {
    if (typeof formRef.value?.validate !== "function") return resolve(true);
    formRef.value.validate((result: boolean) => resolve(result));
  });
  if (!valid) return;

  let payload: Record<string, unknown>;
  try {
    const source = cloneFormValue(form.value);
    payload =
      props.transformSubmit?.(
        source,
        mode.value as Exclude<FormMode, "view">
      ) || source;
  } catch (error) {
    console.error("[CFormModal] 表单提交数据处理失败", error);
    ElMessage.error(formErrorMessage(error));
    return;
  }

  saving.value = true;
  try {
    const action =
      mode.value === "add" || props.updateMethod === "post"
        ? postAction
        : putAction;
    const response = await action(
      mode.value === "add" ? props.api.save : props.api.update,
      payload
    );
    ElMessage.success(response.message || "保存成功");
    close();
    emit("ok");
  } finally {
    saving.value = false;
  }
};

const footerActions = computed<ActionButtonDesc[]>(() => {
  if (mode.value === "view") {
    return [{ name: "close", label: "关闭", onClick: close }];
  }
  return [
    { name: "cancel", label: "取消", onClick: close },
    {
      name: "save",
      type: props.submitType || "primary",
      label: props.submitLabel || "保存",
      loading: () => saving.value,
      onClick: save
    }
  ];
});

defineExpose({
  open(initialValue: Record<string, unknown> = {}) {
    mode.value = "add";
    const source = cloneFormValue(initialValue);
    form.value = props.transformInitialValue?.(source) || source;
    visible.value = true;
  },
  edit(row: Record<string, unknown>) {
    mode.value = "edit";
    const source = cloneFormValue(row);
    form.value = props.transformInitialValue?.(source) || source;
    visible.value = true;
  },
  view(row: Record<string, unknown>) {
    mode.value = "view";
    const source = cloneFormValue(row);
    form.value = props.transformInitialValue?.(source) || source;
    visible.value = true;
  }
});
</script>

<style scoped lang="scss">
:deep(.base-form) {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.c-form-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.c-form-modal__test-fill {
  border-color: #ec4899;
  color: #be185d;
  background: #fdf2f8;
}

.c-form-modal__test-fill:hover,
.c-form-modal__test-fill:focus {
  border-color: #db2777;
  color: #fff;
  background: #db2777;
}
</style>
