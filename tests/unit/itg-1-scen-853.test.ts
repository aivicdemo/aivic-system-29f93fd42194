import { validateContractChangeConsistency } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-853
  test("契約変更前後の整合性検証機能 - 請求額の計算誤りが検出され異常フラグが設定される", () => {
    const beforeContract = {
      contractId: "CTR-2024-001",
      customerId: "CUST-A001",
      serviceId: "SVC-001",
      baseAmount: 100000,
      discountRate: 0.1,
      calculatedBillingAmount: 90000,
      effectiveDate: "2024-01-01",
      updatedAt: "2024-01-01T09:00:00Z",
    };

    const afterContract = {
      contractId: "CTR-2024-001",
      customerId: "CUST-A001",
      serviceId: "SVC-001",
      baseAmount: 100000,
      discountRate: 0.1,
      calculatedBillingAmount: 85000,
      effectiveDate: "2024-02-01",
      updatedAt: "2024-02-01T09:00:00Z",
    };

    const result = validateContractChangeConsistency(
      beforeContract,
      afterContract
    );

    expect(result.isConsistent).toBe(false);
    expect(result.hasError).toBe(true);
    expect(result.errorFlag).toBe("error");
    expect(result.discrepancyAmount).toBe(-5000);
    expect(result.expectedAmount).toBe(90000);
    expect(result.actualAmount).toBe(85000);
    expect(result.errorMessage).toMatch(/計算誤り|請求額|不一致/);
    expect(result.errorCode).toBeDefined();
    expect(result.contractId).toBe("CTR-2024-001");
    expect(result.changeType).toBe("billing_calculation_error");
    expect(Array.isArray(result.detailedLog)).toBe(true);
    expect(result.detailedLog.length).toBeGreaterThan(0);
    expect(result.detailedLog[0]).toMatch(/期待値|実際の値|差分/);
  });
});