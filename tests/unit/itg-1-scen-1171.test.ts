import { extractBillingItems } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求額自動集計・抽出", () => {
  test("SCEN-1171: 単一顧客・単一サービスの営業データから請求対象項目が正確に抽出される", () => {
    // Arrange: テストデータ準備
    const salesData = {
      customerId: "CUST-001",
      serviceId: "SVC-001",
      serviceName: "営業代行サービス",
      usageStartDate: "2024-01-01",
      usageEndDate: "2024-01-31",
      quantity: 10,
      unitPrice: 5000,
      serviceUsageFee: 50000,
      discountRate: 0,
      discountAmount: 0,
      taxRate: 0.1,
    };

    const billingRules = {
      customerId: "CUST-001",
      serviceId: "SVC-001",
      billingTargetFields: [
        "customerId",
        "serviceId",
        "serviceName",
        "usageStartDate",
        "usageEndDate",
        "quantity",
        "unitPrice",
        "serviceUsageFee",
        "discountAmount",
        "subtotal",
        "taxAmount",
        "totalBillingAmount",
      ],
      calculationLogic: {
        subtotal: "serviceUsageFee - discountAmount",
        taxAmount: "subtotal * taxRate",
        totalBillingAmount: "subtotal + taxAmount",
      },
    };

    // Act: 請求額自動集計・抽出機能を実行
    const extractedBillingItems = extractBillingItems(salesData, billingRules);

    // Assert: 抽出された請求対象項目が営業データの入力値と一致することを検証
    expect(extractedBillingItems.customerId).toBe("CUST-001");
    expect(extractedBillingItems.serviceId).toBe("SVC-001");
    expect(extractedBillingItems.serviceName).toBe("営業代行サービス");
    expect(extractedBillingItems.usageStartDate).toBe("2024-01-01");
    expect(extractedBillingItems.usageEndDate).toBe("2024-01-31");
    expect(extractedBillingItems.quantity).toBe(10);
    expect(extractedBillingItems.unitPrice).toBe(5000);
    expect(extractedBillingItems.serviceUsageFee).toBe(50000);
    expect(extractedBillingItems.discountAmount).toBe(0);

    // Assert: 請求システムの必須フィールドをすべて含んでいることを確認
    expect(extractedBillingItems).toHaveProperty("customerId");
    expect(extractedBillingItems).toHaveProperty("serviceId");
    expect(extractedBillingItems).toHaveProperty("serviceName");
    expect(extractedBillingItems).toHaveProperty("usageStartDate");
    expect(extractedBillingItems).toHaveProperty("usageEndDate");
    expect(extractedBillingItems).toHaveProperty("quantity");
    expect(extractedBillingItems).toHaveProperty("unitPrice");
    expect(extractedBillingItems).toHaveProperty("serviceUsageFee");
    expect(extractedBillingItems).toHaveProperty("discountAmount");
    expect(extractedBillingItems).toHaveProperty("subtotal");
    expect(extractedBillingItems).toHaveProperty("taxAmount");
    expect(extractedBillingItems).toHaveProperty("totalBillingAmount");

    // Assert: 請求額の計算式が正確に適用されていることを検証
    // 計算: subtotal = serviceUsageFee - discountAmount = 50000 - 0 = 50000
    expect(extractedBillingItems.subtotal).toBe(50000);

    // 計算: taxAmount = subtotal * taxRate = 50000 * 0.1 = 5000
    expect(extractedBillingItems.taxAmount).toBe(5000);

    // 計算: totalBillingAmount = subtotal + taxAmount = 50000 + 5000 = 55000
    expect(extractedBillingItems.totalBillingAmount).toBe(55000);
  });
});