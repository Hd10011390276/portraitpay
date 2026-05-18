# PortraitPay AI - Claude Code 提示詞

## 當前狀態

- **Dev Server:** `npm run dev` → http://localhost:3000
- **Build:** `npm run build` → 成功，0 errors
- **62 個路由**全部可用

## 項目路徑
`C:\Users\Administrator\portraitpay-next`

## 約束（永遠不能違反）
1. **不改动 UI 整体结构**（侧边栏、DashboardShell 布局）
2. **push 前必须本地验证** `npm run dev` 確認不斷裂
3. **禁止 git push**，只本地修改，等用戶確認後再提交
4. 發現任何功能斷點 → 先給架構設計 + 提示詞，不要直接寫代碼
5. 所有新增 .tsx 文件必須全英文（無中文 JSX 硬編碼）

---

## 當前待解決問題（優先級排序）

### P0 - 功能斷點
1. `/api/v1/celebrity` GET 需要 auth → 演員查詢申請狀態需要登入
2. LawyerCase 完整流程串聯 → 管理員審批舉報後需自動創建案件
3. 律師/演員公開主頁 `/lawyers/[id]`, `/celebrities/[id]` → 未實現
4. 站內消息系統 → 未實現

### P1 - UI/UX 問題
5. Dark mode 在律師儀表板可能不完整
6. `/celebrity` 頁面是否需要加 "已經有帳戶？直接登入" 的入口

### P2 - 清理
7. 未使用的 `ip-register`, `verify-batch`, `report-public` 頁面
8. `face-api` warning（不影響功能，可忽略）

---

## 架構原則

**三方交易最小閉環（演員 / 律師 / 企業）：**

```
演員申請 → /celebrity（等待審批）
律師入駐 → /enterprise/lawyer-registration（等待審批）
企業侵權 → /report（舉報）
管理員 → 審批舉報 → 自動創建 LawyerCase
律師 → /lawyer/cases（處理案件）
結案 → 結算賠償金
```

---

## 提示詞模板

當發現類似"功能割裂"問題時，使用以下格式：

```
【問題】描述
【影響】誰不能做什麼
【檢查範圍】代碼層 + API層 + 前端UI層
【執行提示詞】
1. 檢查 Prisma schema 相關 model 是否缺失字段
2. 檢查 API route 是否有遺漏的關聯查詢
3. 檢查前端頁面是否有權限/數據展示問題
4. 驗證：本地 `npm run dev` + curl 測試所有相關 API endpoints
5. 確認網頁端實際渲染效果
6. **禁止 git push，只在本地修改，等用戶確認後再提交**
```

---

## 測試帳戶
- 郵箱: 799096322@qq.com
- 密碼: Hd210011390276

## 測試文件路徑
- 肖像照片: I:\Portraitpay ai\區塊鏈 測試\肖像\屏幕截圖 2026-05-04 122406.png
- 身份證: I:\Portraitpay ai\區塊鏈 測試\3780dcf20d41bec80b2ea2d566c68b8c.jpg

## 郵件發送 (SMTP)
- SMTP_HOST: smtp.qq.com (端口587, STARTTLS)
- SMTP_USER: contact@portraitpayai.com
- SMTP_PASS: e54gqTGgzSKnCAVg
- EMAIL_FROM: contact@portraitpayai.com

---

## 當前分支
- GitHub: Hd10011390276/portraitpay | main 分支 SHA: `20f74d9`
- 所有修改本地，未 commit
