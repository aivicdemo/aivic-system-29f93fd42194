import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール実行機能", () => {
  test("SCEN-681: 必須項目が1つ以上欠落している営業データが検証エラーとして検出される", () => {
    // 必須項目（顧客名、金額、日付）が1つ以上欠落したテストデータを準備
    const invalidSalesDataMissingCustomerName = {
      customerId: "C001",
      amount: 50000,
      transactionDate: "2024-01-15",
      // customerName は欠落
      serviceType: "アポ",
      status: "confirmed",
    };

    const invalidSalesDataMissingAmount = {
      customerId: "C002",
      customerName: "顧客B",
      transactionDate: "2024-01-16",
      // amount は欠落
      serviceType: "成約",
      status: "confirmed",
    };

    const invalidSalesDataMissingDate = {
      customerId: "C003",
      customerName: "顧客C",
      amount: 75000,
      // transactionDate は欠落
      serviceType: "フォローアップ",
      status: "confirmed",
    };

    const invalidSalesDataMultipleMissing = {
      customerId: "C004",
      // customerName は欠落
      // amount は欠落
      transactionDate: "2024-01-17",
      serviceType: "アポ",
      status: "confirmed",
    };

    // ケース1: 顧客名が欠落している場合
    const result1 = validateSalesDataQuality(
      invalidSalesDataMissingCustomerName
    );
    expect(result1.status).toBe("error");
    expect(result1.errorCode).toBe("MISSING_REQUIRED_FIELD");
    expect(result1.missingFields).toContain("customerName");
    expect(result1.missingFields.length).toBe(1);
    expect(result1.errorMessage).toMatch(/顧客名/);

    // ケース2: 金額が欠落している場合
    const result2 = validateSalesDataQuality(invalidSalesDataMissingAmount);
    expect(result2.status).toBe("error");
    expect(result2.errorCode).toBe("MISSING_REQUIRED_FIELD");
    expect(result2.missingFields).toContain("amount");
    expect(result2.missingFields.length).toBe(1);
    expect(result2.errorMessage).toMatch(/金額/);

    // ケース3: 日付が欠落している場合
    const result3 = validateSalesDataQuality(invalidSalesDataMissingDate);
    expect(result3.status).toBe("error");
    expect(result3.errorCode).toBe("MISSING_REQUIRED_FIELD");
    expect(result3.missingFields).toContain("transactionDate");
    expect(result3.missingFields.length).toBe(1);
    expect(result3.errorMessage).toMatch(/日付/);

    // ケース4: 複数の必須項目が欠落している場合
    const result4 = validateSalesDataQuality(invalidSalesDataMultipleMissing);
    expect(result4.status).toBe("error");
    expect(result4.errorCode).toBe("MISSING_REQUIRED_FIELD");
    expect(result4.missingFields.length).toBe(2);
    expect(result4.missingFields).toContain("customerName");
    expect(result4.missingFields).toContain("amount");
    expect(result4.errorMessage).toMatch(/必須項目/);

    // ケース5: 正常なデータの場合（検証成功）
    const validSalesData = {
      customerId: "C005",
      customerName: "顧客E",
      amount: 100000,
      transactionDate: "2024-01-18",
      serviceType: "成約",
      status: "confirmed",
    };

    const result5 = validateSalesDataQuality(validSalesData);
    expect(result5.status).toBe("success");
    expect(result5.errorCode).toBeUndefined();
    expect(result5.missingFields).toEqual([]);
    expect(result5.errorMessage).toBeUndefined();
  });
});