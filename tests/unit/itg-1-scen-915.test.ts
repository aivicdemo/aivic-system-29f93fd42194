import { validateBillingAmountAnomalyAndDecideApprovalFlow } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-915: [edge] 請求額異常値判定・承認フロー自動決定機能 - 前月データが存在しない初月で、要確認フローが決定される", () => {
    // ===== 前提: テストデータとして、前月データが存在しない初月の売上記録を準備
    const customerId = "CUST-001";
    const currentMonth = "2024-01";
    const currentMonthBillingAmount = 150000;
    const previousMonthBillingAmount = null; // 前月データ不在（初月）

    const testData = {
      customerId: customerId,
      currentMonth: currentMonth,
      currentMonthBillingAmount: currentMonthBillingAmount,
      previousMonthBillingAmount: previousMonthBillingAmount,
    };

    // ===== 発生条件: 請求額異常値判定エンジンに初月売上データを入力
    // ===== 結果: 異常値判定ロジックが前月データ不在の条件を検出し、承認フロー自動決定機能が実行される
    const result = validateBillingAmountAnomalyAndDecideApprovalFlow(testData);

    // ===== 期待結果: 前月データが存在しない初月である場合、
    // 前月比較による異常値判定ができないため、請求額は『要確認フロー』として分類される
    expect(result).toEqual({
      customerId: "CUST-001",
      currentMonth: "2024-01",
      currentMonthBillingAmount: 150000,
      isAnomalyDetected: false,
      approvalFlowType: "要確認",
      reason: "前月データが存在しないため、前月比較による異常値判定ができません",
      requiresManualApproval: true,
    });
  });
});