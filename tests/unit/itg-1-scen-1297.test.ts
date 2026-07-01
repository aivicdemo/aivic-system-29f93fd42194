import { approveInvoiceInfo } from "../../src/logic/it-1-2-1";

describe("請求情報の最終承認判定", () => {
  test("SCEN-1297: 承認基準を満たさない場合にステータスが差戻しとなり修正対象が通知される", () => {
    // 準備: 承認基準を満たさない請求情報データ
    // 基準1: 請求額が0以上であること
    // 基準2: 顧客IDが存在すること
    // 基準3: サービス種別が指定されていること
    // 基準4: 請求対象期間が有効であること
    // 基準5: 契約状態が有効であること

    // テスト1: 請求額が負数（基準1違反）
    const invalidInvoiceAmount = {
      invoiceId: "INV-2024-001",
      customerId: "CUST-A001",
      serviceType: "consultation",
      billingPeriodStart: "2024-01-01",
      billingPeriodEnd: "2024-01-31",
      contractStatus: "active",
      invoiceAmount: -5000,
      itemCount: 3,
      calculationLogic: "base_rate_plus_performance",
    };

    const resultAmountInvalid = approveInvoiceInfo(invalidInvoiceAmount);
    expect(resultAmountInvalid.status).toBe("差戻し");
    expect(resultAmountInvalid.rejectionReasons).toContain("請求額");
    expect(resultAmountInvalid.correctionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "invoiceAmount", reason: expect.stringContaining("正数") }),
      ])
    );
    expect(resultAmountInvalid.notificationMessage).toContain("基準を満たしていません");

    // テスト2: 顧客IDが空（基準2違反）
    const invalidCustomerId = {
      invoiceId: "INV-2024-002",
      customerId: "",
      serviceType: "development",
      billingPeriodStart: "2024-01-01",
      billingPeriodEnd: "2024-01-31",
      contractStatus: "active",
      invoiceAmount: 150000,
      itemCount: 5,
      calculationLogic: "fixed_fee",
    };

    const resultCustomerIdInvalid = approveInvoiceInfo(invalidCustomerId);
    expect(resultCustomerIdInvalid.status).toBe("差戻し");
    expect(resultCustomerIdInvalid.rejectionReasons).toContain("顧客ID");
    expect(resultCustomerIdInvalid.correctionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "customerId" }),
      ])
    );

    // テスト3: サービス種別が不正（基準3違反）
    const invalidServiceType = {
      invoiceId: "INV-2024-003",
      customerId: "CUST-B002",
      serviceType: "invalid_service",
      billingPeriodStart: "2024-01-01",
      billingPeriodEnd: "2024-01-31",
      contractStatus: "active",
      invoiceAmount: 200000,
      itemCount: 4,
      calculationLogic: "variable_fee",
    };

    const resultServiceTypeInvalid = approveInvoiceInfo(invalidServiceType);
    expect(resultServiceTypeInvalid.status).toBe("差戻し");
    expect(resultServiceTypeInvalid.rejectionReasons).toContain("サービス種別");

    // テスト4: 請求対象期間が逆転（基準4違反）
    const invalidPeriod = {
      invoiceId: "INV-2024-004",
      customerId: "CUST-C003",
      serviceType: "training",
      billingPeriodStart: "2024-01-31",
      billingPeriodEnd: "2024-01-01",
      contractStatus: "active",
      invoiceAmount: 75000,
      itemCount: 2,
      calculationLogic: "performance_based",
    };

    const resultPeriodInvalid = approveInvoiceInfo(invalidPeriod);
    expect(resultPeriodInvalid.status).toBe("差戻し");
    expect(resultPeriodInvalid.rejectionReasons).toContain("請求対象期間");
    expect(resultPeriodInvalid.correctionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "billingPeriodStart" }),
        expect.objectContaining({ field: "billingPeriodEnd" }),
      ])
    );

    // テスト5: 契約状態が無効（基準5違反）
    const inactiveContract = {
      invoiceId: "INV-2024-005",
      customerId: "CUST-D004",
      serviceType: "consulting",
      billingPeriodStart: "2024-01-01",
      billingPeriodEnd: "2024-01-31",
      contractStatus: "inactive",
      invoiceAmount: 100000,
      itemCount: 3,
      calculationLogic: "fixed_fee",
    };

    const resultContractInvalid = approveInvoiceInfo(inactiveContract);
    expect(resultContractInvalid.status).toBe("差戻し");
    expect(resultContractInvalid.rejectionReasons).toContain("契約状態");

    // テスト6: 複数基準違反（請求額・顧客ID・契約状態）
    const multipleViolations = {
      invoiceId: "INV-2024-006",
      customerId: "",
      serviceType: "support",
      billingPeriodStart: "2024-01-01",
      billingPeriodEnd: "2024-01-31",
      contractStatus: "suspended",
      invoiceAmount: 0,
      itemCount: 1,
      calculationLogic: "base_rate",
    };

    const resultMultipleViolations = approveInvoiceInfo(multipleViolations);
    expect(resultMultipleViolations.status).toBe("差戻し");
    expect(resultMultipleViolations.rejectionReasons.length).toBeGreaterThanOrEqual(3);
    expect(resultMultipleViolations.rejectionReasons).toContain("請求額");
    expect(resultMultipleViolations.rejectionReasons).toContain("顧客ID");
    expect(resultMultipleViolations.rejectionReasons).toContain("契約状態");
    expect(resultMultipleViolations.correctionItems.length).toBeGreaterThan(2);
    expect(resultMultipleViolations.notificationMessage).toContain("複数の項目");

    // テスト7: すべての基準を満たす場合は承認状態（比較用・成功ケース）
    const validInvoice = {
      invoiceId: "INV-2024-007",
      customerId: "CUST-E005",
      serviceType: "consultation",
      billingPeriodStart: "2024-01-01",
      billingPeriodEnd: "2024-01-31",
      contractStatus: "active",
      invoiceAmount: 250000,
      itemCount: 5,
      calculationLogic: "performance_based",
    };

    const resultValid = approveInvoiceInfo(validInvoice);
    expect(resultValid.status).toBe("承認済み");
    expect(resultValid.rejectionReasons.length).toBe(0);
    expect(resultValid.correctionItems.length).toBe(0);
    expect(resultValid.notificationMessage).toBe("");
  });
});