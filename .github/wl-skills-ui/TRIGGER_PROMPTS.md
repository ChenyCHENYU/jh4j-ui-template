# wl-skills-ui Skill 触发提示

## 核心原则

- wl-skills-ui 优先保证样式绝对管控，覆盖纯 Element Plus、老项目封装、Base*/jh*/C\_\* 以及 wl-skills-kit 最佳写法
- 不管是否使用 wl-skills-kit，wl-skills-ui 都要先保证视觉统一，再按需引导规范化重构

## 组合流程

- 新项目：用 wl-ui 的 new-project-init 流程接入统一 UI 风格
- 老项目：用 wl-ui 的 legacy-skin-align 流程做老项目化妆对齐
- 全量审计：用 wl-ui 的 full-audit 流程扫描当前项目，不修改代码
- 渐进迁移：用 wl-ui 的 progressive-migrate 流程从 skin 迁移到 runtime

## 智能触发

- 用户说"样式乱 / 不统一 / 老项目化妆"：先调用 wl_ui_route_intent，再调用 wl_ui_scan --mode skin
- 用户说"卡片 / Tab / 详情 / 树 / 抽屉 / 上传 / 步骤条 / 更多操作"：触发对应 Element Plus 组件族 skill
- 扫描 JSON 返回后：调用 wl_ui_recommend_flow 判断 recommendedFlows、nextActions 和 kitBridge

## 单点触发

- 用 wl-ui 的 vendors/base-table skill 检查当前文件
- 用 wl-ui 的 vendors/jh-components skill 检查当前文件
- 用 wl-ui 的 element/el-table skill 检查当前文件
- 用 wl-ui 的 element 组件族 skill 检查 card/tabs/descriptions/tree/drawer/upload/steps/overlay/navigation/feedback
- 用 wl-ui 的 runtime/design-tokens skill 检查硬编码颜色

## 分工边界

- wl-skills-ui：视觉一致性、化妆层、设计令牌、Runtime 渲染、UI 扫描修复
- wl-skills-kit：编码规范、页面生成、菜单/字典/权限同步、通用 Agent Pipeline

## 执行约束

- 扫描只读，修复前必须等待用户确认
- skin 模式只处理 L0/L1/L2，不改业务布局和 runtime
- fix 前建议先 dry-run 或通过 MCP 调用 wl_ui_fix_dry_run
- 涉及 BaseTable render-type/cid、renderOps 或页面结构规范时，视觉统一后再桥接 wl-skills-kit validate-page / doctor-ui
