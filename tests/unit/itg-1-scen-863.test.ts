import { recordContractChange } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更内容の標準化記録機能 - 請求金額0円・負数検出", () => {
  test("SCEN-863: 請求金額が0円または負数の場合、不正データとして検出・記録・警告される", () => {
    // ===== テスト1: 請求金額0円のケース =====
    const contractChange_zero = {
      contractId: "CONTRACT-001",
      customerId: "CUST-2024-001",
      changeType: "billing_amount_update",
      previousBillingAmount: 100000,
      newBillingAmount: 0,
      changeReason: "客先からの要求により請求金額を0円に変更",
      changedAt: "2024-01-15T10:30:00Z",
      changedBy: "user123",
    };

    const result_zero = recordContractChange(contractChange_zero);

    // (1) 不正データとして検出されることを確認
    expect(result_zero.isValid).toBe(false);
    expect(result_zero.validationErrors).toContain("請求金額");

    // (2) 不正データ記録機能に記録される
    expect(result_zero.isRecordedInIrregularLog).toBe(true);
    expect(result_zero.irregularLogId).toBeDefined();
    expect(typeof result_zero.irregularLogId).toBe("string");

    // (3) ユーザーへエラーメッセージ表示
    expect(result_zero.errorMessage).toBeDefined();
    expect(result_zero.errorMessage).toMatch(/請求金額/);
    expect(result_zero.errorLevel).toBe("error");

    // (4) 管理画面の不正データログで「標準化対象外」として登録
    expect(result_zero.irregularDataStatus).toBe("exclude_from_standardization");
    expect(result_zero.requiresManualReview).toBe(true);

    // ===== テスト2: 請求金額が負数（-1000）のケース =====
    const contractChange_negative = {
      contractId: "CONTRACT-002",
      customerId: "CUST-2024-002",
      changeType: "billing_amount_update",
      previousBillingAmount: 150000,
      newBillingAmount: -1000,
      changeReason: "誤入力による負数値",
      changedAt: "2024-01-15T11:00:00Z",
      changedBy: "user124",
    };

    const result_negative = recordContractChange(contractChange_negative);

    // (1) 不正データとして検出されることを確認
    expect(result_negative.isValid).toBe(false);
    expect(result_negative.validationErrors).toContain("請求金額");

    // (2) 不正データ記録機能に記録される
    expect(result_negative.isRecordedInIrregularLog).toBe(true);
    expect(result_negative.irregularLogId).toBeDefined();
    expect(typeof result_negative.irregularLogId).toBe("string");

    // (3) ユーザーへエラーメッセージ表示
    expect(result_negative.errorMessage).toBeDefined();
    expect(result_negative.errorMessage).toMatch(/請求金額/);
    expect(result_negative.errorLevel).toBe("error");

    // (4) 管理画面の不正データログで「要確認対象」として登録
    expect(result_negative.irregularDataStatus).toBe("requires_review");
    expect(result_negative.requiresManualReview).toBe(true);

    // ===== テスト3: 正常な請求金額（正の整数）のケース =====
    const contractChange_valid = {
      contractId: "CONTRACT-003",
      customerId: "CUST-2024-003",
      changeType: "billing_amount_update",
      previousBillingAmount: 100000,
      newBillingAmount: 120000,
      changeReason: "契約内容変更に伴う請求金額の更新",
      changedAt: "2024-01-15T12:00:00Z",
      changedBy: "user125",
    };

    const result_valid = recordContractChange(contractChange_valid);

    // 正常データは不正ログに記録されない
    expect(result_valid.isValid).toBe(true);
    expect(result_valid.validationErrors.length).toBe(0);
    expect(result_valid.isRecordedInIrregularLog).toBe(false);
    expect(result_valid.errorMessage).toBeNull();
    expect(result_valid.requiresManualReview).toBe(false);

    // 正常データは標準化対象として登録
    expect(result_valid.irregularDataStatus).toBe("standardized");
  });
});