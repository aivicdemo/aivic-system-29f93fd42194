import { validateReportApprovalCriteria } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-652: [error] レポート内容承認基準判定機能 - データ完全性チェックで不足データが検出された場合に承認不可と判定される
  test("データ完全性チェックで不足データが検出された場合に承認不可と判定される", () => {
    const incompleteReportData = {
      reportId: "RPT-2024-001",
      customerId: "CUST-123",
      month: "2024-01",
      appointmentCount: 5,
      contractCount: 2,
      // customerFeedback は必須項目だが欠落
      generatedDate: "2024-02-01T09:00:00Z",
      preparedBy: "user-001",
    };

    const result = validateReportApprovalCriteria(incompleteReportData);

    expect(result.isApproved).toBe(false);
    expect(result.validationStatus).toBe("FAILED");
    expect(result.missingFields).toContain("customerFeedback");
    expect(result.approvalJudgment).toBe("承認不可");
  });
});