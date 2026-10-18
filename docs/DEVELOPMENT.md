# 后续开发指南

> 对应当前代码状态：分支 `feat/p0-p2-baseline`（基于 `main@cbc5e6e`）。
> 本文档基于逐文件走查得出，路径和结论都可直接对照代码验证。
> P0、P1 已实施；P2 的代码准备已完成，真实店铺联调需店铺凭证。

## 1. 现状快照

| 项 | 值 |
| --- | --- |
| 框架 | React Router 7.15（framework mode，`ssr: true`）+ Hydrogen 2026.10 |
| 运行时 | Oxygen / MiniOxygen（Worker，无 Node API） |
| 样式 | Tailwind v4（CSS 配置）+ `app/tokens.css` 设计 token |
| 数据 | Storefront API，每个路由自带 `gql` 查询，`gql.tada` 推导类型 |
| 当前数据源 | mock.shop（`MOCK_SHOP=1`），无需 token |
| 路由 | `/`、`/products/:handle`、`/collections`、`/collections/:handle`、`/search`、`/cart`、`/account`、`*` |
| 代码规模 | `app/` 下 50 个文件，约 1.1 万行 |

已完成的能力：分面筛选 + 排序 + 加载更多、预测搜索、购物车抽屉（Standard Actions）、Customer Account 骨架、商品/集合 JSON-LD、Shopify 分析埋点、无障碍（skip link / focus ring / `aria-live`）。

未完成/缺失：真实店铺联调（待店铺凭证）、多语言、多币种、e2e 测试、lint。

---

## 2. P0 基线修复（已完成）

### 2.1 补 `dev:https` 脚本（已落地）

**问题**：`vite.config.ts` 用 `process.env.npm_lifecycle_event === "dev:https"` 决定是否启用 `localHttps`，`.env.example` 与 `README.md` 都让用户跑 `npm run dev:https`，但 `package.json` 里没有这个 script。

**影响**：`app/lib/customer-account.ts` 里有 `if (new URL(request.url).protocol !== "https:") return;`，非 HTTPS 下 `/account` 永远返回 `unavailable`，登录流程走不通。

**已改为**（`package.json`）：

```json
"dev:https": "vite dev"
```

验证：`npm run dev:https` 后访问 `https://localhost:5173`，浏览器首次会提示证书不受信（`localHttps` 自签名，属正常）。

### 2.2 补 `test` 脚本（已落地）

`__test__/` 的 `node:test` 用例原本没有入口。**实际踩到两个坑**：

1. `node --test __test__`（目录参数）在 Node 22.12 会被当成模块入口加载，报 `Cannot find module`。必须用 glob：
   ```json
   "test": "node --experimental-strip-types --test \"__test__/*.test.ts\""
   ```
2. `root-layout.test.ts` 与 `storefront.test.ts` 会加载 `@shopify/hydrogen` 运行时，它调用 `module.registerHooks`，**该 API 需要 Node 22.15+**。在 22.12 上这两个文件必然失败（`SyntaxError: ... does not provide an export named 'registerHooks'`），与代码无关。

结论：完整 5 个文件全绿需要 Node ≥ 22.15 或 24；22.12 下可跑其余用例。`engines` 保持官方模板的 `^22.12 || ^24`，不因测试单独抬高。

### 2.3 固定换行符（已落地）

首次提交时 git 对几乎每个文件都告警 `LF will be replaced by CRLF`，说明 Windows 上 `core.autocrlf=true` 且仓库没有 `.gitattributes`。多人协作会产出整文件 diff。

已新增 `.gitattributes`：

```gitattributes
* text=auto eol=lf
*.png binary
*.ico binary
*.woff2 binary
```

仓库既有 blob 本身已是 LF，因此没有执行 `git add --renormalize .`（会产生无内容变化的批量条目）。若后续仍出现告警，再执行一次即可。

### 2.4 清理模板残留文案（已落地）

| 位置 | 原状 | 现改为 |
| --- | --- | --- |
| `app/routes/account.tsx` | 硬编码 `Account · CORE` | `formatPageTitle("Account", shopName)` |
| `app/routes/home.tsx` | 固定 `Home · Shop` | 直接用店铺名作首页标题 |
| `app/routes/collection.tsx` | 描述 `Shop the X collection page.` | 集合自身 `description`（截断 160 字），无则回退 |
| `app/routes/product.tsx` | 固定 `Product · Shop` | 商品标题 + 商品 `description` 截断 |

新增 `app/lib/storefront-shop.ts` 的 `truncateMetaDescription(text, maxLength = 160)`：折叠空白、按词边界截断、末尾补 `…`。单测见 `__test__/storefront-shop.test.ts`。

### 2.5 加 lint / format（可选但推荐）

当前 `devDependencies` 无 eslint / prettier，Tailwind 类名顺序全靠手写。建议加 `prettier` + `prettier-plugin-tailwindcss`（类名自动排序，改 `CollectionBrowse.tsx` 这类 800 行组件时收益明显）。

---

## 3. P1 品牌与视觉（1~2 天）

### 3.1 改主色：只动一个值

`app/tokens.css` 的 `--color-primary` 是唯一源头，当前已从 `#5d0707`（酒红）改为 `#1f3d35`（深墨绿）：

```css
--color-primary: #1f3d35;            /* 换这一行即可整站换色 */
--color-interactive-hover: color-mix(in oklab, var(--color-primary) 85%, black);
--color-accent: oklch(from var(--color-primary) calc(l + 0.17) calc(c * 0.39) calc(h - 9));
```

需要换回或换其它品牌色时，只改这一行，派生色自动跟随。

hover / active / focus ring / swatch 选中态 / 徽标全部由此派生，不需要逐个组件改。

### 3.2 字体与排版

- 字体变量：`--font-body`、`--font-heading`（当前 `system-ui`）
- 字号阶梯：`--type-heading-2xl` … `--type-subheading`，已包装成 `.type-display`、`.type-heading-xl` 等工具类，组件里直接用类名，不要写 `text-3xl` 绕开体系
- **注意**：`app/app.css` 顶部注释明确写了「不要在这里加 web font 或 `@theme` font 覆盖」。要换字体，改 `tokens.css` 里的 `--font-*`，并在 `app/root.tsx` 的 `links` 里加字体 `<link>`

### 3.3 圆角 / 间距 / 版心

| 用途 | 变量 |
| --- | --- |
| 卡片圆角 | `--radius-card`（当前 `0`，直角） |
| 按钮圆角 | `--radius-button` |
| 版心宽度 | `--spacing-page`（`80rem`） |
| 页面左右留白 | `--spacing-margin`（移动端 `1rem`，桌面 `2.5rem`） |
| 触控目标 | `--spacing-touch-target`（`2.75rem`，勿低于此值） |

### 3.4 边界：不要把 `tokens.css` 当普通样式表改

该文件头注释说明它由 storefront kit 生成、用于内联到参考页（`scripts/inline-core-tokens.ts`），`app/app.css` 称其为 "frozen core"。规则：

- 可以改**变量值**
- 不要删变量名（`bg-surface`、`text-on-surface`、`rounded-card`、`type-heading-xl` 等类名全依赖它们）
- 应用级样式（抽屉动画、滚动锁）留在 `app/app.css`

### 3.5 首页结构

`app/routes/home.tsx` 是三段式：`HomeHero` → `NewArrivals`（`products(first: 8, sortKey: CREATED_AT)`）→ `ShopByCategory`（`collections(first: 3)`）。hero 的选取逻辑被抽到 `app/lib/home-hero.ts`（取最近更新的集合），要换成运营位/手动选品就改这里。

---

## 4. P2 接真实店铺（代码已就绪，联调需凭证）

### 4.1 模式切换是自动的

`app/lib/shop.ts` 的 `shouldUseMockShop()` 规则：`MOCK_SHOP=1` 或有 mock.shop 域名 → mock；否则只要有 `PRIVATE_STOREFRONT_API_TOKEN` 就走真实店铺。业务代码无需改动。

### 4.2 步骤

1. Shopify Partner 建 Development Store → 装 Headless 渠道
2. 拿 Private Storefront API token
3. `.env` 填写（或 `npx shopify hydrogen link` + `npx shopify hydrogen env pull`）：

```dotenv
# MOCK_SHOP=1            ← 注释掉
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PRIVATE_STOREFRONT_API_TOKEN=shpat_xxx
PUBLIC_STOREFRONT_ID=    # 可选，填了才上报 Shopify 分析
```

4. 账户功能额外需要（缺一个就静默禁用 `/account`）：

```dotenv
SHOP_ID=
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=
SESSION_SECRET=          # ≥32 位随机串
```

5. 必须 HTTPS：`npm run dev:https`（依赖 2.1）

**当前状态**：代码侧已就绪。

- `.env.example` 补齐了可选的 `PUBLIC_CHECKOUT_DOMAIN`
- `/account` 不可用时按原因给出提示（mock 模式 / 非 HTTPS / 缺配置），见 `app/routes/account.tsx` 的 `unavailableReason`
- `dev:https` 脚本已可用

**仍缺的**：真实店铺凭证（`PRIVATE_STOREFRONT_API_TOKEN` 等）。没有凭证只能停留在 mock.shop，下单、登录、库存与分析上报都无法验收。

### 4.3 mock.shop 能力边界

| 能力 | mock.shop | 真实店铺 |
| --- | --- | --- |
| 商品/集合/搜索查询 | 支持 | 支持 |
| 购物车增删改 | 支持 | 支持 |
| 结账（跳转支付） | 不支持（假 checkout） | 支持 |
| Customer Account 登录 | 不支持 | 支持（需 HTTPS + 三项配置） |
| Shopify 分析上报 | 关闭（`headless` 通道） | 开启（需 `PUBLIC_STOREFRONT_ID`） |
| 库存 / metafield / markets | 视店铺而定 | 完整 |

**结论**：任何与下单、登录、库存、多币种有关的验收，必须在 dev store 上做。

---

## 5. P3 功能扩展清单

按「投入产出比」排序，每项都标了落点。

| 优先级 | 功能 | 落点 | 备注 |
| --- | --- | --- | --- |
| 高 | 商品详情页拆分 | `app/routes/product.tsx`（约 900 行） | 先拆 `Gallery` / `VariantPicker` / `AddToCart` / `RelatedProducts`，再改版式 |
| 高 | 图片响应式 | 新建 `app/components/ShopifyImage.tsx` | 当前全站裸 `<img>`，没用 Shopify CDN 的 `width` 参数生成 `srcset`；改用后 LCP 与移动端流量明显改善 |
| 高 | 多语言/多币种 | `app/lib/shop.ts` 的 `storefrontConfig.i18n`（`as const` 写死 US/EN） | 要改成从 URL 前缀或 cookie 推导，并同步 `ShopifyScripts` 的 `i18n`、购物车 country；用 Shopify Markets 承载 |
| 中 | 免运费进度条 | `app/components/CartDrawer.tsx` | 阈值建议走店铺 shipping 政策或 metafield，不要硬编码 |
| 中 | 加购推荐 | `app/components/CartDrawer.tsx` + 新查询 | 详情页已有 `relatedProducts` 可复用查询形状 |
| 中 | 尺寸表 / 详情富文本 | `product.tsx` 查询加 `metafields(namespace:"custom")` | 依赖店铺侧先录入 metafield |
| 中 | 内容页（About / Journal / FAQ） | `app/routes/*.tsx` + `app/routes.ts` 注册 | 博客走 `blog(handle)` 查询，需店铺有 Blog |
| 中 | 结构化数据补全 | 已有 Product / BreadcrumbList | 补 `Organization`、`WebSite` + `SearchAction` |
| 低 | 收藏 / 心愿单 | 新 `app/lib/wishlist.ts` | localStorage 方案注意 SSR 无 `window`；跨设备要落 Customer Account metafield |
| 低 | 商品评价 | `product.tsx` 插入区块 | 第三方脚本注意 CSP 与 Worker 环境 |
| 低 | GA4 / Meta Pixel | `app/root.tsx` + `app/components/AnalyticsTrackers.tsx` | 现有 `PageViewedTracker` / `CartAnalyticsTracker` 可作模板 |

### 新页面标准流程

1. 新建 `app/routes/xxx.tsx`，导出 `meta` / `loader` / `default`
2. `app/routes.ts` 注册 `route("xxx", "routes/xxx.tsx")`
3. 跑 `npm run typecheck`（内部先 `react-router typegen`）生成 `./+types/xxx`

顺序反了 TypeScript 会报找不到 `+types`。

---

## 6. P4 性能与 SEO

- **缓存**：`server.ts` 已 `caches.open("hydrogen-v1")` 并注入 `RouterContextProvider`，Storefront 客户端复用它。给列表/详情设置 Cache-Control 时改 loader 返回的 `headers`，不要自己开会话级缓存
- **首屏图片**：`ProductCard` 已有 `priority`（集合页前三张 eager + `fetchPriority`），新增列表组件时保持同一约定
- **查询数量**：禁止在 loader 里 for 循环逐个查商品（Storefront API 有速率限制），一律用一次查询 + `nodes`
- **meta**：每个路由的 `meta` 目前是通用串，接真实店铺后应改为商品/集合自身字段（`seo.title` / `seo.description` 已在 GraphQL 中可用，需补查询字段）
- **canonical**：筛选/排序参数会产生重复 URL，建议在 `collection.tsx` 输出 `canonical` 指向无参数版本

---

## 7. P5 部署与运行时

- Oxygen：`npm run build` → `npm run deploy`（`dist/client` + `dist/server`）
- 换平台（Vercel / Cloudflare）：改 `server.ts` 的 `export default { fetch }` 适配对应 adapter，替换 `vite.config.ts` 里的 `oxygen()` 插件，并确认 `caches` API 与 `ExecutionContext.waitUntil` 语义一致
- Worker 环境限制：**没有 `fs` / `net` / `child_process` / `Buffer`**，第三方 SDK 若依赖 Node 内置模块会直接崩，选型时先验证

---

## 8. 架构约定（Do / Don't）

**Do**

- 数据在 loader 取，组件通过 `loaderData` 消费；查询写在使用它的路由文件里
- 新增服务端能力用 `createXxxServerHandlers()`，注册进 `app/root.tsx` 的 `middleware` 里 `handleShopifyRoutes` 的 `handlers` 数组
- 私有环境变量一律通过 `context.get(envContext)` 读取
- 共享 GraphQL 片段放组件旁边（如 `PRODUCT_CARD_FRAGMENT` 在 `ProductCard.tsx`）

**Don't**

- 不要写 Remix 老式的 `export async function action()`，本项目走 handlers 架构
- 不要改 `app/standard-actions.d.ts`（Hydrogen 官方运行时类型契约）
- 不要自己实现支付/结账，必须跳 `checkoutUrl`
- 不要在客户端引用 `PRIVATE_STOREFRONT_API_TOKEN`
- 不要在 `loader` 里做 N+1 查询
- 不要提交 `.env`
- 不要删除 `tokens.css` 的变量名

**共享片段的影响面**：改 `app/components/ProductCard.tsx` 里的 `PRODUCT_CARD_FRAGMENT` 会同时影响首页、集合页、搜索页、详情页关联推荐四处；改字段前先确认 `ProductCard` 的 props 类型同步。

---

## 9. 每次改动后的验证清单

```powershell
npm run typecheck     # 生成 +types 并做全量类型检查
npm run build         # 确认 worker 构建通过
npm test              # 2.2 补齐后可用
```

手测路径（约 5 分钟）：

1. `/` 首页 hero 与两个商品区渲染正常
2. `/collections` → 进入任一集合 → 勾选筛选、切换排序、点加载更多
3. `/products/<handle>` → 切换规格 → 加购 → 抽屉出现
4. `/cart` 改数量、删除、去结账（mock 下应跳假 checkout）
5. `/search?q=shirt` 预测搜索与结果页排序
6. `/account`（真实店铺 + HTTPS 下）登录与订单列表

---

## 10. 里程碑建议

| 阶段 | 目标 | 产出 | 验收 |
| --- | --- | --- | --- |
| M1 | 基线可用 | 2.1~2.4 完成，`typecheck` / `build` / `test` 全绿 | 三个命令零报错 |
| M2 | 品牌可视 | 主色、字体、圆角、首页文案替换完成 | 桌面+移动端截图对照 |
| M3 | 真实店铺 | dev store 打通，购物车与结账可用 | 真机走通下单（测试支付） |
| M4 | 内容与 SEO | meta/canonical/JSON-LD 补全，About 等页面 | Lighthouse SEO ≥ 95 |
| M5 | 功能增强 | 按第 5 节挑 2~3 项 | 每项独立 PR |
| M6 | 上线 | Oxygen 部署，绑定域名 | 公网 URL 可访问 |

建议节奏：M1 与 M2 可并行；M3 有外部依赖（Shopify 账号审批），尽早启动。

---

## 11. 参考

- Hydrogen 文档：https://shopify.dev/docs/storefronts/headless/hydrogen
- Storefront API：https://shopify.dev/docs/api/storefront
- mock.shop 店铺目录：https://mock.shop/llms.txt
- Shopify AI Toolkit：https://shopify.dev/docs/apps/build/ai-toolkit
