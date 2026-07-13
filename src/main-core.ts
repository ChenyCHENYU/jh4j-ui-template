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

export default async function () {
  const app: App = createApp(AppVue);

  app.use(ElMessage);
  app.config.globalProperties.$message = ElMessage;

  ElDialog.props.closeOnClickModal.default = false;
  ElDialog.props.closeOnPressEscape.default = false;

  app.use(store);

  const e = await fetch("/env-dev.json").then((res) => res.text());
  envConfig().getProcessEnv = function () {
    return JSON.parse(e);
  };

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
    console.warn("[main-core] agGridApp/plugin load failed, skip registration:", e);
  }

  app.mount("#app");
  WindowFlag.setStoreIsReady(true);

  if (envConfig().getProcessEnv().VUE_APP_TOKEN_LOCALSTORAGE) {
    envConfig().tokenStorage = "localStorage";
  }

  fetchRemoteComponent("public", "./init-main/index.ts").then((init) => {
    if (typeof init === "function") {
      init(app);
    }
  });
}
