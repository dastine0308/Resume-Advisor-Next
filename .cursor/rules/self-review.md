# Self-review checklist（resume-advisor-next）

送 PR 或 `/review` 前約 15～20 分鐘。目標：減少「修完再 review 又冒出新 High」的情況。

**本次 PR 一句 intent**（先寫再勾選）：

> 

---

## 1. 主流程：按鈕到 API 整條路

不只改 store/API，沿 **按鈕 → store → API → 成功/失敗 UI** 走一遍。

| 路徑 | 關鍵檔案 |
|------|----------|
| Resume step 1 | `resume-content.tsx`, `job-description-form.tsx`, `useJobPostingStore` |
| Resume step 2 | `content-builder-form.tsx`, `useResumeStore` |
| Cover letter | `cover-letter/page.tsx`, `cover-letter-draft.ts`, `useDocuments` |
| Dashboard | `dashboard/page.tsx`, `useDocuments` |

- [ ] API **throw** 時有 toast / 狀態，不是白屏或未處理的 rejection
- [ ] 按鈕不會在錯誤後永遠 disabled 或卡住

---

## 2. Async：debounce、flush、卸載

- [ ] `useDebouncedCallback` 在 unmount 用 **ref** 做 `flush()`（避免 stale closure）
- [ ] 離開頁面時 `resetStore` 不會誤傷其他頁需要的狀態
- [ ] 沒有 `while (flag)` **無 timeout** 的忙等（例：`isAutoSaving`）

---

## 3. React Query：Suspense / cache / 錯誤

- [ ] 新增的 `useSuspense*` 失敗時，`(main)/error.tsx` + `QueryErrorResetBoundary` 行為可接受
- [ ] `queryKey` 在 id 切換時正確（`resumeId`、`cover-letter?id=`、`COVER_LETTER_QUERY_KEY`）
- [ ] mutation / save 後有 **invalidate** 單筆 query（若 UI 依賴該 cache）

---

## 4. Job 品質：lib = store = API

改動涉及職缺分析或儲存時，三處規則一致：

| 層級 | 檔案 |
|------|------|
| 規則 | `src/lib/job-analysis-quality.ts` |
| 客戶端 | `useJobPostingStore`, `getStep1AdvanceBlockReason`, `resume-content.tsx` |
| 伺服器 | `api/ai/analyze-job`, `api/job-postings` |

- [ ] **部分 update**（只送 `job_id` + 單欄位）不會意外繞過 `canPersistJobPosting`
- [ ] placeholder（Unknown 等）在 client 與 API 都被擋

---

## 5. AI 點數：扣款與退款

- [ ] `analyze-job`（及其他 AI route）每條失敗路徑有 `refundAiCredits`
- [ ] 手動或整合測：短文本 / 低品質 / 422 後點數不變

---

## 6. Zustand：單一真相來源

- [ ] 同一概念只有一個來源（例：cover letter 的 resume → `content.resume_id`，勿依賴未更新的 `resumeId`）
- [ ] `job-posting-storage` persist 不會載入舊 Unknown 與新 gate 衝突

---

## 7. 跨資源連結（resume ↔ cover letter ↔ job）

- [ ] `findLinkedResume`：`resume_id` 優先，找不到再 `job_id` fallback（`cover-letter-draft.ts`）
- [ ] 列表晚載入時有 backfill（`contentWithLinkedResumeId`）
- [ ] 刪 resume / 無效 `?id=` 的 UX 符合預期（not_found vs error boundary）

---

## 8. 邊界 ID / 權限

- [ ] 404/403 用 `ApiRequestError.status` 處理（`api-client.ts`, `useSuspenseCoverLetter`）
- [ ] 不存在的 document id 顯示 not_found，而非無意義的 error 頁（若為產品預期）

---

## 9. 測試

| 改動類型 | 建議 |
|----------|------|
| 純規則 | `src/lib/__tests__/` |
| API 契約 | `tests/integration/api-*.test.ts` |
| 新 UI 流程 | 手動情境或一條整合測 |

- [ ] 相關 unit / integration 已跑過
- [ ] 新分支行為有對應測試（非只改實作）

---

## 10. 第二輪 review 的 scope

送 review 時可貼：

> 請只驗：上次 High/Medium 是否修完 + 本次 diff；Low 除非 regression 否則不擴大。

- [ ] PR 描述含 **一句 intent** 與本 checklist 極簡版勾選

---

## 極簡版（貼 PR 用）

```
[ ] 主流程：成功 + 失敗都有回饋
[ ] debounce / unmount / resetStore 無競態
[ ] Suspense / queryKey / invalidate 正確
[ ] job 品質：lib = store = API
[ ] AI 失敗有 refund
[ ] store 單一真相 / persist 舊資料
[ ] resume–CL–job 連結與 not_found
[ ] 測試或手動情境已跑
```

---

## 相關指令

- 單元測試：`npm test`（或專案慣用指令）
- 整合測：需 dev server + env（見 `tests/helpers/env.ts`）
