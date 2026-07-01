import { extractBillingTargetItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-591: [edge] 請求対象項目の抽出と分類 - 同一顧客・同一サービスの営業データが複数件存在する場合、全件が正確に分類される
  test("同一顧客・同一サービスの営業データ3件が全て正確に抽出・分類される", () => {
    const salesData = [
      {
        salesDataId: "sd-001",
        customerId: "cust-A",
        serviceCode: "svc-X",
        contractDateTime: new Date("2024-01-15T10:00:00Z"),
        appointmentCount: 5,
        contractCount: 2,
        billingStatus: "NEW",
        amount: 50000,
      },
      {
        salesDataId: "sd-002",
        customerId: "cust-A",
        serviceCode: "svc-X",
        contractDateTime: new Date("2024-01-20T14:30:00Z"),
        appointmentCount: 3,
        contractCount: 1,
        billingStatus: "UPDATE",
        amount: 30000,
      },
      {
        salesDataId: "sd-003",
        customerId: "cust-A",
        serviceCode: "svc-X",
        contractDateTime: new Date("2024-01-25T09:15:00Z"),
        appointmentCount: 2,
        contractCount: 0,
        billingStatus: "CANCEL",
        amount: 0,
      },
    ];

    const result = extractBillingTargetItems(salesData);

    // 抽出件数は3件のままで、重複削除が行われないことを検証
    expect(result.extractedItems).toHaveLength(3);

    // 各データが異なるID（重複排除されていない）を保持
    expect(result.extractedItems[0].salesDataId).toBe("sd-001");
    expect(result.extractedItems[1].salesDataId).toBe("sd-002");
    expect(result.extractedItems[2].salesDataId).toBe("sd-003");

    // 各データが正しいステータス分類を保持
    expect(result.extractedItems[0].billingStatus).toBe("NEW");
    expect(result.extractedItems[1].billingStatus).toBe("UPDATE");
    expect(result.extractedItems[2].billingStatus).toBe("CANCEL");

    // 各データが正しい金額を保持
    expect(result.extractedItems[0].amount).toBe(50000);
    expect(result.extractedItems[1].amount).toBe(30000);
    expect(result.extractedItems[2].amount).toBe(0);

    // 同一顧客・同一サービスで分類されていることを検証
    expect(result.extractedItems.every((item) => item.customerId === "cust-A")).toBe(true);
    expect(result.extractedItems.every((item) => item.serviceCode === "svc-X")).toBe(true);

    // 分類結果のログが正常に出力されていることを検証
    expect(result.classificationLog).toBeDefined();
    expect(result.classificationLog.totalProcessed).toBe(3);
    expect(result.classificationLog.classifiedByStatus).toEqual({
      NEW: 1,
      UPDATE: 1,
      CANCEL: 1,
    });

    // 顧客ごと・サービスごとの請求額集計を検証
    expect(result.summaryByCustomerService).toHaveLength(1);
    expect(result.summaryByCustomerService[0].customerId).toBe("cust-A");
    expect(result.summaryByCustomerService[0].serviceCode).toBe("svc-X");
    expect(result.summaryByCustomerService[0].totalAmount).toBe(80000); // 50000 + 30000 + 0
    expect(result.summaryByCustomerService[0].itemCount).toBe(3);
  });
});