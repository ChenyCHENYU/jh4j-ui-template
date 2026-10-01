<script setup lang="ts">
import { computed, ref } from "vue";
import { columnsDef, useDemoTreeListPage, type DemoTreeNode } from "./data";

/**
 * 示例左树右表页（tree-list 骨架示范）：
 * - 左侧 C_Tree（内置组件，Tab 切换 + 关键词过滤），点击节点过滤右表
 * - jh-drag-col 拖拽调整左右宽度（平台运行时全局注册）
 * - 右侧为 list-page 缩微形态：标题 + BaseTable(AG Grid) + 分页
 * C_Tree / jh-drag-col / BaseTable / jh-pagination 均为平台全局组件，无需 import。
 */
const { treeData, activeFactory, page, paged, handleNodeClick, changePage } =
  useDemoTreeListPage();

const treeWidth = ref(240);
const columns = computed(() => columnsDef());

const currentLabel = computed(() => activeFactory.value || "全部工厂");

function onNodeClick(node: DemoTreeNode) {
  handleNodeClick(node);
}
</script>

<template>
  <div class="tree-list demo-tree-list">
    <div class="tree-list__aside" :style="{ width: treeWidth + 'px' }">
      <C_Tree :tree-data="treeData" @node-click="onNodeClick" />
    </div>

    <jh-drag-col v-model="treeWidth" :min="180" :max="360" />

    <div class="tree-list__main">
      <div class="list-page">
        <div class="list-page__title">示例订单列表（{{ currentLabel }}）</div>

        <div class="list-page__table">
          <BaseTable
            cid="tpl001-demo-tree-list"
            :data="paged"
            :columns="columns"
            row-key="id"
            render-type="agGrid"
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
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
