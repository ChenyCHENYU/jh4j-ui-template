/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Module Federation 远程模块声明
declare module "agGridApp/plugin" {
  import type { App } from "vue";
  const plugin: (app: App) => void;
  export default plugin;
}

declare module "main/init-platform" {
  const initPlatform: (options: any) => any;
  export { initPlatform };
}

declare module "main/store/index.ts" {
  const store: any;
  export default store;
}

declare module "main/language/index.ts" {
  const language: any;
  export default language;
}

declare module "main/permission.ts" {
  const initPermission: (...args: any[]) => any;
  export default initPermission;
}

declare module "systemApp/*" {
  const component: any;
  export default component;
}

declare module "virtual:__federation__" {
  export function __federation_method_setRemote(
    module: string,
    config: any
  ): any;
  export function __federation_method_getRemote(
    module: string,
    path: string
  ): Promise<any>;
  export function __federation_method_unwrapDefault(module: any): Promise<any>;
}

// lodash-es 复用 @types/lodash 的类型定义
declare module "lodash-es" {
  export * from "lodash";
  export { default } from "lodash";
}

declare module "lodash-es/forOwn" {
  import forOwn from "lodash/forOwn";
  export default forOwn;
}
