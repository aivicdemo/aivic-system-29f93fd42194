import { validateBillingAmount, approveBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-974
  test("手順書の基準値と計算結果が完全一致した境界ケースで承認可能と判定できる", () => {
    // Arrange: テストデータを準備
    const billingRecord = {
      billingId: "BILL-2024-001",
      customerId: "CUST-123",
      serviceId: "SVC-456",
      billingAmount: 1000000,
      calculatedAmount: 1000000,
      standardBenchmarkAmount: 1000000,
      currency: "JPY",
      billingDate: "2024-01-15",
      status: "pending",
    };

    // Act: 請求額検証機能を実行
    const validationResult = validateBillingAmount(billingRecord);

    // Assert: 検証結果の確認
    expect(validationResult).toEqual({
      isValid: true,
      validationStatus: "passed",
      calculatedAmount: 1000000,
      standardBenchmarkAmount: 1000000,
      variance: 0,
      matchesStandard: true,
      errorMessage: null,
    });

    // Act: 承認判定機能を実行
    const approvalResult = approveBillingAmount(validationResult);

    // Assert: 承認判定結果の確認
    expect(approvalResult).toEqual({
      approvalStatus: "approved",
      isApprovable: true,
      approvalReason: "基準値との一致確認済み",
      calculatedAmount: 1000000,
      standardBenchmarkAmount: 1000000,
      variance: 0,
      timestamp: expect.any(String),
      approverRemark: "手順書基準値と完全一致",
    });

    expect(approvalResult.approvalStatus).toBe("approved");
    expect(approvalResult.isApprovable).toBe(true);
    expect(approvalResult.approvalReason).toMatch(/基準値/);
    expect(approvalResult.calculatedAmount).toBe(1000000);
  });
});