import { App, createApp } from "vue";
import "reflect-metadata";
import AppVue from "./App.vue";
import { initPlatform } from "main/init-platform";
import envConfig from "@jhlc/common-core/src/store/env-config";

import "element-plus/dist/index.css";
import "./assets/style/element.scss";
import "./assets/style/main.scss";
import ElementPlus from "element-plus";
import locale from "element-plus/lib/locale/lang/zh-cn";
import { ElDialog, ElMessage } from "element-plus";
import SvgIconsPlugin from "@/components/global/C_SvgIcon/svgicon";
import "@jhlc/common-core/lib/types.d.ts";
import {
  fetchAsyncComponent,
  fetchComponent,
  fetchRemoteComponent
} from "@/util/system";
import { WindowFlag } from "@jhlc/common-core/src/types/window-flag";
import initPermission from "main/permission.ts";
import store from "main/store/index.ts";
import VueI18n from "main/language/index.ts";
import { registerHiddenRoutes } from "@/util/navigate-hidden";
import { installCommonPreset } from "@agile-team/wl-skills-ui/runtime/common-preset";

export default async function () {
  const app: App = createApp(AppVue);

  // wl-skills-ui 业务渲染预设（状态/分类/编号等字段自动渲染 Tag/徽标）
  installCommonPreset();

  app.use(ElMessage);
  app.config.globalProperties.$message = ElMessage;

  ElDialog.props.closeOnClickModal.default = false;
  ElDialog.props.closeOnPressEscape.default = false;

  app.use(store);

  const e = await fetch("/env-dev.json").then((res) => res.text());
  envConfig().getProcessEnv = function () {
    return JSON.parse(e);
  };

  // 路由守卫首次导航时就会读取 token。必须在请求实例、远程模块和
  // router 初始化之前确定存储介质，避免整页刷新时误按 Cookie 查找。
  if (envConfig().getProcessEnv().VUE_APP_TOKEN_LOCALSTORAGE) {
    envConfig().tokenStorage = "localStorage";
  }

  const request = await import("@jhlc/common-core/src/util/real-request").then(
    (res) => res.default
  );

  const plugins = await fetchRemoteComponent("public", "./plugins/index.ts");
  app.use(plugins);

  app.use(VueI18n);

  const router = await fetchRemoteComponent("public", "./router/index.ts");

  initPlatform({
    app,
    request,
    router,
    layout: () => fetchRemoteComponent("public", "./layout/index.vue"),
    businessViews: {},
    getView: function () {
      return null;
    },
    fetchComponent,
    fetchRemoteComponent,
    fetchAsyncComponent
  });

  registerHiddenRoutes(router);
  app.use(router);
  initPermission(router);

  app.use(ElementPlus, {
    locale,
    size: "small"
  });
  app.use(SvgIconsPlugin);

  try {
    const { default: AgGridPlugin } = await import("agGridApp/plugin");
    AgGridPlugin(app);
  } catch (e) {
    console.warn(
      "[main-core] agGridApp/plugin load failed, skip registration:",
      e
    );
  }

  app.mount("#app");
  WindowFlag.setStoreIsReady(true);

  fetchRemoteComponent("public", "./init-main/index.ts").then((init) => {
    if (typeof init === "function") {
      init(app);
    }
  });
}
