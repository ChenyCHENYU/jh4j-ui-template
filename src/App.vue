<template>
  <div style="height: 100%">
    <el-config-provider>
      <router-view v-if="!routerLoading && isRouterAlive" />
      <GlobalComponentContent />
    </el-config-provider>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, provide } from "vue";
import { useRouter } from "vue-router";
import { GlobalComponentContent } from "@jhlc/common-core/src/global/global-components";

import { ElConfigProvider } from "element-plus";

const router = useRouter();
// 路由加载等待（首屏 loading 由 index.html 的 #loader-wrapper 承载，与 public 一致）
const routerLoading = ref(true);
// 路由完成初始解析
router.isReady().then(() => {
  // 更改路由加载等待状态
  routerLoading.value = false;
  // 触发 index.html 的 .loaded 过渡动画
  document.body.classList.add("loaded");
});

const isRouterAlive = ref(true);

const reload = () => {
  isRouterAlive.value = false;
  nextTick(() => {
    isRouterAlive.value = true;
  });
};

provide("reload", reload);
</script>

<style lang="scss"></style>
