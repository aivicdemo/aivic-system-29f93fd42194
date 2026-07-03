import { validateBillingDataConsistency } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-806: 請求データ妥当性自動検証機能 - 請求内容が契約条件・営業成果データと一致している場合に検証を通過する", () => {
    // 契約条件データ
    const contractData = {
      contractId: "CNT-2024-001",
      customerId: "CUST-ABC123",
      serviceId: "SVC-STANDARD",
      contractAmount: 100000,
      contractStartDate: "2024-01-01",
      contractEndDate: "2024-12-31",
      unitPrice: 1000,
      discountRate: 0.1,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 150000,
    };

    // 営業成果データ
    const salesPerformanceData = {
      salesDataId: "SALES-2024-001",
      customerId: "CUST-ABC123",
      serviceId: "SVC-STANDARD",
      appointmentCount: 50,
      contractCount: 30,
      salesAmount: 30000,
      customerReaction: "positive",
      recordDate: "2024-01-31",
      month: "2024-01",
    };

    // 請求内容データ（契約条件と営業成果データから計算）
    // 計算: 売上額 30,000 × 単価 1,000 ÷ 1,000 = 30,000
    // 割引適用: 30,000 × (1 - 0.1) = 27,000
    // 最小請求額チェック: 27,000 < 50,000 なので最小請求額 50,000 を適用
    const billingData = {
      billingId: "BILL-2024-001",
      customerId: "CUST-ABC123",
      serviceId: "SVC-STANDARD",
      contractId: "CNT-2024-001",
      billingMonth: "2024-01",
      baseAmount: 30000,
      discountRate: 0.1,
      discountAmount: 3000,
      billingAmount: 50000,
      billingStartDate: "2024-01-01",
      billingEndDate: "2024-01-31",
      validationStatus: "pending",
    };

    // 妥当性検証を実行
    const validationResult = validateBillingDataConsistency({
      billingData,
      contractData,
      salesPerformanceData,
    });

    // 期待結果: 検証が通過し、ステータスが "valid" で詳細が正常
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.status).toBe("valid");
    expect(validationResult.billingAmount).toBe(50000);
    expect(validationResult.discountApplied).toBe(true);
    expect(validationResult.minimumBillingApplied).toBe(true);
    expect(validationResult.errors).toEqual([]);
    expect(validationResult.warnings).toEqual([]);
    expect(typeof validationResult.validatedAt).toBe("string");
  });
});