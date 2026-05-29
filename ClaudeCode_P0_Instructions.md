# PortraitPay P0 执行指令 — 机构账号体系 + /enterprise/dashboard

## 一、前置必读：上次 session 踩过的坑

每次执行 `npm run build` 或 `npx prisma generate` 前，先执行：
```bash
taskkill //F //IM node.exe
```
否则会遇到 `query_engine-windows.dll.node.tmp*` 文件锁导致 build 失败。

**Surgical Change 边界模糊**：每次改完一个变量，必须搜索整个文件确认没有遗漏的死代码。删除一块代码时，要同步删除它引入的所有 unused 引用。

**JSX 嵌套注意**：编辑 TSX/JSX 结构时，先读清楚周围 20-30 行的标签嵌套关系再替换，确保所有 div 标签正确闭合。

---

## 二、Phase 1：Prisma Schema 字段补充（P0 核心）

### 2.1 修改 `prisma/schema.prisma`

**A. `AgencyAccount` 模型 — 修改字段：**

找到 `AgencyAccount` 模型中的 `agencyType` 字段，将类型从默认字符串修改为支持以下值的字符串类型：
- `ROOT_SPONSOR` — 遗产/品牌方（如 Triumph International），拥有最高权限
- `ENTERPRISE_LAWYER` — 企业/律所
- `ENTERTAINMENT_AGENCY` — 经纪公司
- `ESTATE` — 遗产管理方

将 `rightsScope` 字段从 `String[]` 修改为 `Json` 类型（支持更复杂的权限描述结构）。

**B. `AgencyArtistContract` 模型 — 新增字段：**

在 `AgencyArtistContract` 模型中新增以下字段（确保字段类型和默认值正确）：

```prisma
royaltySplit     Decimal  @default(0.0) @db.Decimal(5, 4)   // 机构分成比例，如 0.20 = 20%
minGuarantee    Decimal? @db.Decimal(12, 2)                // 最低保证收益，可选
territories     String[] @default([])                       // 授权地域，如 ["CN", "GLOBAL"]
rightsGranted   String[] @default([])                       // 授权权利列表，如 ["NAME", "IMAGE", "VOICE", "MUSIC_COMPOSITION", "MASTER_RECORDING", "DIGITAL_CLONE"]
```

**C. 确认字段已存在：**

确认 `AgencyArtistContract` 中 `contractStart`、`contractEnd`、`contractType`、`representation` 等字段已正确存在。

### 2.2 执行 Prisma Client 生成

```bash
taskkill //F //IM node.exe && npx prisma generate
```

确认 Prisma Client 成功生成，无 DLL 锁错误。

---

## 三、Phase 2：/enterprise/dashboard 页面开发

### 3.1 页面优先级（按此顺序执行）

```
A（Agency Profile）→ B（Artist Contract Portfolio）→ D（Escrow Overview）→ C（Rights Chain 展示层）→ E + F → G
```

**理由：**
- **A 最先但只做快速交付**：它是入口卡片，信息展示即可，不依赖其他模块
- **B 是整个 dashboard 的价值核心**：艺人合同管理是 IP Owner 最关心的业务，没有 B 就没有授权链、没有资金流。**全力做 B**
- **D 依赖 B 的数据**：royaltySplit 来自合同，B 做完 D 才能正确计算
- **C 可以并行做展示层**：授权链可视化，数据层的 RightsChainNode 校验逻辑在 P1 阶段处理
- **E + F 合在一起做**：侵权监测 + 数字资产，属于保护层，锦上添花
- **G 最后做**：收益报表是终极大招，依赖 D 和 B 的完整数据

### 3.2 各模块详细规格

#### A. Agency Profile（机构信息卡片）
- 机构名称、认证状态、机构类型
- rightsScope JSON 结构可视化展示（格式化 JSON，展示权限范围）
- 艺人总数、合同总数、账户状态
- 任何 ENTERPRISE/AGENCY 角色都能看到

#### B. Artist Contract Portfolio（艺人合同管理）⭐ 最核心
- 艺人列表（关联 AgencyArtistContract）
- 每份合同详情：
  - 艺人名称、合同状态（status）
  - royaltySplit（艺术家分成比例）
  - minGuarantee（最低保证）
  - territories（授权地域）
  - rightsGranted（授予权利列表）
  - contractStart / contractEnd
  - contractType（EXCLUSIVE | SEMI_EXCLUSIVE | NON_EXCLUSIVE | MANAGER）
- 支持查看合同详情弹窗或跳转详情页

#### C. Rights Chain（授权链管理，展示层）
- 以当前机构作为 ROOT，展示其授权链
- 每节点显示：scope（JSON 可视化）、territorialScope、exclusivity
- **【架构约束】子节点授权范围校验在后端 API 层实现，不在前端做**：前端只负责展示和引导，后端 `/api/v1/agency/rights-chain` 负责强校验

#### D. Escrow Overview（资金托管）
- AgencyEscrow 余额概览
- 区分：总收入（totalAmount）、待释放（heldAmount）、可提现（availableAmount）
- 最近交易记录（AgencyEscrowTransaction）
- 资金流设计：机构从授权收益中获取 royaltySplit 部分，艺人所得直接进入艺人账户

#### E. Infringement Monitor（侵权监测）
- 侵权举报列表（关联 InfringementReport）
- 监测任务状态
- 处理进度
- 支持按状态筛选

#### F. Digital Assets（数字资产）
- 声纹注册状态（关联 VoiceEmbedding）
- DigitalHumanProfile 关联展示（未来扩展）
- AI 内容合规状态（水印/标注）

#### G. Earnings Report（收益报表）
- 按时间/艺人/授权类型筛选
- 机构分成 vs 艺人所得分离显示
- 可导出 CSV

### 3.3 技术实现要求

- **新建页面**：`src/app/enterprise/dashboard/page.tsx`
- **布局**：复用 DashboardShell，根据用户 role 显示对应侧边栏
- **API 新建**：`GET /api/v1/agency/profile` — 返回当前用户的 AgencyAccount + 相关统计（艺人总数、合同总数、Escrow 余额）
- **数据层**：完全依赖已有的 AgencyAccount、AgencyArtistContract、AgencyEscrow、DigitalHumanProfile 模型
- **路由映射**：
  - TALENT → /dashboard
  - LAWYER → /lawyer/dashboard
  - AGENCY / ENTERPRISE → /enterprise/dashboard
  - ADMIN / VERIFIER → /admin

### 3.4 路由注册（如需要）

在 `src/app/(dashboard)` 的 layout.tsx 或 routing 配置中注册新路由，确保 `/enterprise/dashboard` 路径正确映射。

---

## 四、Phase 3：本地验证（每次 push 之前必做）

1. `npm run build` — 确认编译通过，0 errors
2. `taskkill //F //IM node.exe && npm run dev` — 重启开发服务器
3. 等待 8-10 秒，热编译完成后再访问
4. 验证以下路径：
   - http://localhost:3000/enterprise/dashboard — 页面加载正常，无白屏
   - 艺人合同数据是否正确显示（包括新增字段）
   - Escrow 余额是否正确展示
   - 无 JSX 编译错误（如标签未闭合）

**【禁止 git push，只在本地修改，等用户确认后再提交】**

---

## 五、架构红线（任何时候都不能违反）

1. ** Rights Chain 校验在后端做**：前端只展示，后端 API 负责"子节点授权范围 ≤ 父节点"的强校验，禁止前端绕过校验
2. **不改动 UI 整体结构**：侧边栏、DashboardShell 布局不能改
3. **无硬编码**：所有字段都是用户自己配置，不做 MJ/Triumph/场馆 相关的硬编码
