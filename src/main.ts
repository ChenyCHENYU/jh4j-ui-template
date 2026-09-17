import "reflect-metadata";
// 2026-09 退出 windicss：模板内无原子类消费方，等效 preflight 样式重置
// 已迁至 src/assets/style/main.scss 顶部，无需虚拟模块。
import "virtual:svg-icons-register";

import MainCore from "./main-core";

MainCore();
