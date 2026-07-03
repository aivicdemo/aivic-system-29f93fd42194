import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - データ型チェック", () => {
  test("SCEN-1102: 数値項目に文字列が入力された場合、データ型エラーを検出する", () => {
    // 正常な売上金額（数値）
    const validRecord = {
      recordId: "rec_001",
      customerId: "cust_001",
      salesAmount: 150000,
      quantity: 5,
      contactDate: "2024-01-15",
    };

    const validResult = validateSalesDataQuality(validRecord);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // 売上金額に文字列が入力された不正なレコード
    const invalidRecord = {
      recordId: "rec_002",
      customerId: "cust_001",
      salesAmount: "150000",
      quantity: 5,
      contactDate: "2024-01-15",
    };

    const invalidResult = validateSalesDataQuality(invalidRecord);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
    expect(invalidResult.errors[0].fieldName).toBe("salesAmount");
    expect(invalidResult.errors[0].errorType).toBe("DATA_TYPE_MISMATCH");
    expect(invalidResult.errors[0].expectedType).toBe("number");
    expect(invalidResult.errors[0].actualValue).toBe("150000");

    // 数量に文字列が入力された別のケース
    const invalidRecord2 = {
      recordId: "rec_003",
      customerId: "cust_001",
      salesAmount: 100000,
      quantity: "10",
      contactDate: "2024-01-15",
    };

    const invalidResult2 = validateSalesDataQuality(invalidRecord2);
    expect(invalidResult2.isValid).toBe(false);
    expect(invalidResult2.errors.length).toBeGreaterThan(0);
    expect(invalidResult2.errors[0].fieldName).toBe("quantity");
    expect(invalidResult2.errors[0].errorType).toBe("DATA_TYPE_MISMATCH");
    expect(invalidResult2.errors[0].expectedType).toBe("number");

    // 複数の数値項目に不正なデータ型が混在
    const invalidRecord3 = {
      recordId: "rec_004",
      customerId: "cust_001",
      salesAmount: "200000",
      quantity: "8",
      contactDate: "2024-01-15",
    };

    const invalidResult3 = validateSalesDataQuality(invalidRecord3);
    expect(invalidResult3.isValid).toBe(false);
    expect(invalidResult3.errors.length).toBe(2);
    expect(invalidResult3.errors[0].fieldName).toBe("salesAmount");
    expect(invalidResult3.errors[1].fieldName).toBe("quantity");

    // エラーメッセージが処理を中断し、データが後続処理に進まない
    expect(invalidResult.processStatus).toBe("FAILED");
    expect(invalidResult2.processStatus).toBe("FAILED");
    expect(invalidResult3.processStatus).toBe("FAILED");
  });
});