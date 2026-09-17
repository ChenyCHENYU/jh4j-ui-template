# 示例订单列表 · API 契约

> 页面级机器可读接口契约（wl-api-contract 格式示范）。
> 真实项目中由 `wl-skills` 工具链单向生成并校验漂移，禁止手改同步产物；
> 模板中仅作为格式参考。示例页面当前使用本地静态数据，未消费以下接口。

```json
{
  "contractStatus": "draft",
  "module": "template",
  "page": "demo/list",
  "apis": [
    {
      "action": "queryPage",
      "method": "POST",
      "url": "/tpl/demo/order/queryPage",
      "permission": "tpl:demo:order:list",
      "request": {
        "orderNo": "string? 订单编号（模糊）",
        "materialName": "string? 物料名称（模糊）",
        "current": "number 页码，从 1 起",
        "size": "number 每页条数"
      },
      "response": {
        "records": "DemoOrder[]",
        "total": "number"
      }
    },
    {
      "action": "save",
      "method": "POST",
      "url": "/tpl/demo/order/save",
      "permission": "tpl:demo:order:add",
      "request": "DemoOrder",
      "response": "void"
    },
    {
      "action": "delete",
      "method": "POST",
      "url": "/tpl/demo/order/delete",
      "permission": "tpl:demo:order:remove",
      "request": { "id": "number" },
      "response": "void"
    }
  ],
  "dicts": [
    {
      "code": "tpl_demo_status",
      "usage": "状态列 Tag 渲染",
      "fallback": "本地 STATUS_MAP（见 data.ts）"
    }
  ]
}
```

## 字段说明

| 字段           | 类型              | 说明                           |
| -------------- | ----------------- | ------------------------------ |
| `orderNo`      | string            | 订单编号，唯一                 |
| `materialName` | string            | 物料名称                       |
| `factoryName`  | string            | 工厂名称                       |
| `quantity`     | number            | 数量                           |
| `weight`       | number            | 重量（吨），两位小数           |
| `status`       | "0" \| "1" \| "2" | 0 待处理 / 1 处理中 / 2 已完成 |
| `createDate`   | string            | 创建日期 YYYY-MM-DD            |
