import { validateApprovalReasonAndRootCause } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1008
  test("査定部署長による妥当性判定結果の確認・承認 - 判定根拠データが不完全または欠落している場合にエラーが返却される", () => {
    const incompleteApprovalData = {
      caseId: "CASE-20240115-001",
      judgmentCategoryId: "JDG-MARKET-001",
      judgmentLogicVersionId: "LOGIC-V2-001",
      deviationRatePercentage: 15.5,
      deviationAmountYen: 250000,
      referenceDataCount: 45,
      priceBookSourceVersion: "PRICE-2024-01",
      correctionCoefficient: 1.08,
      judgedBy: "APPRAISER-U001",
      judgmentTimestamp: "2024-01-15T10:30:00Z",
      judgmentReason: "市場相場より高めの見積",
      mobileApprovalComment: "",
      approvalRootCauseAnalysis: null,
      attachedReferenceDocumentIds: [],
      caseStatus: "pending_approval"
    };

    const result = validateApprovalReasonAndRootCause(incompleteApprovalData);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/根拠/);
    expect(result.missingFields).toContain("approvalRootCauseAnalysis");
    expect(result.caseStatus).toBe("pending_approval");
  });
});