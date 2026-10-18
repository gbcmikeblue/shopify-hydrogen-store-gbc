# shopify-hydrogen-store

一个用 **Shopify Hydrogen（React Router 7 框架模式 + SSR）** 搭的无头（headless）电商练手项目，基于 Shopify 官方 `hydrogen` 仓库的 `templates/react-router` 骨架，默认对接 **mock.shop**（免费公开的模拟 Storefront API，**不需要 Shopify 账号 / token**）。

当前状态：可本地跑起来，首页 / 商品详情 / 集合列表 / 搜索 / 购物车 / 账户 全部可用，数据为 mock.shop 的服装目录。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | React Router 7（framework mode，SSR） |
| 电商 SDK | `@shopify/hydrogen` 2026.10.x |
| 运行时 | Oxygen（生产）/ MiniOxygen（本地）|
| 构建 | Vite 8 + TypeScript |
| 样式 | Tailwind CSS v4 + `app/tokens.css` 设计变量 |
| 类型 | `gql.tada` 生成 GraphQL 类型 |

## 目录速览

```
app/
  routes.ts            路由表（要加页面先改这里）
  root.tsx             全局布局 + middleware（注入 Storefront 客户端、购物车、会话）
  routes/              home / product / collection / collections / search / cart / account
  components/          Header、CartDrawer、SearchDrawer、ProductCard ... 纯展示组件
  lib/                 storefront 客户端、cart 状态、shop 配置、predictive search 等
  tokens.css           设计 token（改品牌色从这里开始）
server.ts              Oxygen worker 入口
```

数据流：`loader` 里用 `storefrontClient.graphql(...)` 发查询 → 组件通过 `loaderData` 拿数据。**每个路由自己拥有 GraphQL 查询**，类型由 gql.tada 推断。

## 本地运行

需要 **Node 22.12+ 或 24**。本机已在 `D:\project\.tools\node22` 放了一份（系统默认的 node 是 16/20，版本不够）。

```powershell
$env:PATH = 'D:\project\.tools\node22;' + $env:PATH
cd D:\project\shopify-hydrogen-store
npm install
npm run dev          # http://localhost:5173
npm run dev:https    # HTTPS 本地开发（/account 登录必需）
npm test             # node:test 单测
npm run typecheck    # 生成路由类型并做全量类型检查
```

> 单测中 `root-layout.test.ts` / `storefront.test.ts` 依赖 Hydrogen 运行时的 `module.registerHooks`，需要 **Node ≥ 22.15** 才能通过；其余用例在 22.12 下即可运行。

`.env` 已设置为 `MOCK_SHOP=1`，开箱即用。想换 mock.shop 里的其它店铺（宠物、滑雪板等），把 `PUBLIC_STORE_DOMAIN` 设成对应 host（目录见 https://mock.shop/llms.txt），例如 `pets.mock.shop`。

## 接入真实店铺

1. 注册 Shopify Partner → 建免费的 Development Store → 装 Headless 渠道
2. 拿到 Private Storefront API token，写进 `.env`：

```dotenv
# 注释掉 MOCK_SHOP=1
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_STOREFRONT_ID=          # 可选，填了才有 Shopify 分析
PRIVATE_STOREFRONT_API_TOKEN=shpat_xxx
```

3. 或者用 CLI 自动拉取（需登录）：

```powershell
npx shopify hydrogen link
npx shopify hydrogen env pull
```

4. 部署到 Oxygen（免费）：

```powershell
npm run build
npm run deploy
```

## 练手路线（建议按顺序做）

- [x] 跑通骨架，理解 loader → 组件 的数据流
- [x] 改一处 UI（`app/components/AnnouncementBar.tsx` 里的公告文案）
- [ ] 换主题：改 `app/tokens.css` 的色板 / 字体，做出自己的品牌感
- [ ] 新增「商品筛选」维度：`app/routes/collection.tsx` 里加价格区间或 tag 过滤
- [x] 新增页面：`/about` 已落地（`app/routes/about.tsx`），可照此加 `/journal`
- [x] 响应式图片：`app/components/ShopifyImage.tsx` 生成 CDN `srcSet`
- [x] 结构化数据：Organization / WebSite / Product / BreadcrumbList
- [ ] 购物车进阶：加「满额免运费进度条」或「加购推荐」（`app/components/CartDrawer.tsx`）
- [ ] 接 Customer Account 登录（需要真实店铺 + `npm run dev:https`）
- [ ] 部署到 Oxygen，拿到公网 URL

## 展示建议

- 有公网 URL 远比截图有说服力，`npm run deploy` 后直接贴链接
- 截图/录屏走一遍：首页 → 商品详情 → 加购 → 购物车抽屉 → 搜索
- 不要提交 `.env`（已在 `.gitignore`），token 泄露会被 Shopify 判违规

## 注意

- Storefront API 有速率限制，别在 `loader` 里循环逐个查商品
- 结账必须跳转到 Shopify 自己的 checkout（除非 Plus），不要自己实现支付
- mock.shop 是演示数据源，不能下单付款；真实验证要用 dev store

## License

MIT（继承自 Shopify 官方模板）
