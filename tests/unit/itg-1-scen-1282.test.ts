import { describe, test, expect } from "@jest/globals";
import { extractAndValidateBillingItems } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求対象項目の抽出・妥当性検証", () => {
  test("SCEN-1282: 抽出された請求対象項目に漏れまたは重複があり、検出・通知される", () => {
    // 【テストデータ準備】
    const salesData = [
      {
        recordId: "sr-001",
        customerId: "cust-A",
        billableFlag: true,
        amount: 50000,
        billingDate: "2024-01-31",
        serviceType: "service-X",
      },
      {
        recordId: "sr-002",
        customerId: "cust-B",
        billableFlag: true,
        amount: 75000,
        billingDate: "2024-01-31",
        serviceType: "service-Y",
      },
      {
        recordId: "sr-003",
        customerId: "cust-C",
        billableFlag: true,
        amount: 100000,
        billingDate: "2024-01-31",
        serviceType: "service-Z",
      },
      {
        recordId: "sr-004",
        customerId: "cust-A",
        billableFlag: false,
        amount: 0,
        billingDate: "2024-01-31",
        serviceType: "service-X",
      },
      // 重複レコード（sr-002 と同じ customerId, serviceType）
      {
        recordId: "sr-005",
        customerId: "cust-B",
        billableFlag: true,
        amount: 75000,
        billingDate: "2024-01-31",
        serviceType: "service-Y",
      },
    ];

    // 【関数実行】
    const result = extractAndValidateBillingItems(salesData);

    // 【抽出結果の検証】
    // billableFlag=true のレコードは sr-001, sr-002, sr-003, sr-005 の 4 件が対象
    expect(result.extractedItems).toHaveLength(4);

    // 【抽出レコード数と元データの比較 - 漏れがないか確認】
    const billableRecords = salesData.filter((r) => r.billableFlag === true);
    expect(result.extractedItems.length).toBe(billableRecords.length);

    // 【重複チェック】
    // sr-002 と sr-005 は同じ customerId="cust-B" と serviceType="service-Y" の組み合わせ
    const duplicatesByCustomerService = result.extractedItems.reduce(
      (acc, item) => {
        const key = `${item.customerId}_${item.serviceType}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, typeof result.extractedItems>
    );

    // 重複が存在することを確認
    expect(duplicatesByCustomerService["cust-B_service-Y"]).toHaveLength(2);

    // 【漏れ・重複検出結果の検証】
    expect(result.validationStatus).toBe("INVALID");

    // 【エラー情報の検証】
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe("DUPLICATE");
    expect(result.errors[0].message).toMatch(/重複/);
    expect(result.errors[0].affectedRecordIds).toContain("sr-002");
    expect(result.errors[0].affectedRecordIds).toContain("sr-005");

    // 【通知内容の検証】
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toMatch(/cust-B/);
    expect(result.notifications[0]).toMatch(/service-Y/);

    // 【抽出結果の内容検証】
    const extractedCustomerIds = result.extractedItems.map(
      (item) => item.customerId
    );
    expect(extractedCustomerIds).toContain("cust-A");
    expect(extractedCustomerIds).toContain("cust-B");
    expect(extractedCustomerIds).toContain("cust-C");

    // 【金額の合計検証】
    const totalAmount = result.extractedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    expect(totalAmount).toBe(300000); // 50000 + 75000 + 100000 + 75000

    // 【エラーコードの検証】
    expect(result.errorCode).toBe("BILLING_ITEMS_VALIDATION_ERROR");
  });
});