<script setup lang="ts">
import { ref } from "vue";
import { STATUS_MAP, type DemoOrder } from "../list/data";

/**
 * 示例详情页（detail-page 骨架示范）：
 * - 顶部面包屑 + 返回按钮（el-page-header）
 * - 基本信息卡片 el-descriptions（border 统一详情容器）
 * - 状态字段使用 Tag 渲染，禁止纯文本
 * 真实项目通过路由参数加载详情数据；示例页直接展示静态数据。
 */
const detail = ref<DemoOrder>({
  id: 1,
  orderNo: "SO-20260901-001",
  materialName: "示例物料 A",
  factoryName: "示例工厂一",
  quantity: 120,
  weight: 35.5,
  status: "2",
  createDate: "2026-09-01"
});

function handleBack() {
  window.history.back();
}
</script>

<template>
  <div class="detail-page demo-detail">
    <div class="detail-page__header">
      <el-page-header content="订单详情" @back="handleBack" />
    </div>

    <el-card class="detail-page__card" header="基本信息">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">
          {{ detail.orderNo }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="STATUS_MAP[detail.status].type" size="small">
            {{ STATUS_MAP[detail.status].label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="物料名称">
          {{ detail.materialName }}
        </el-descriptions-item>
        <el-descriptions-item label="工厂">
          {{ detail.factoryName }}
        </el-descriptions-item>
        <el-descriptions-item label="数量">
          {{ detail.quantity }}
        </el-descriptions-item>
        <el-descriptions-item label="重量（吨）">
          {{ detail.weight }}
        </el-descriptions-item>
        <el-descriptions-item label="创建日期" :span="2">
          {{ detail.createDate }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
