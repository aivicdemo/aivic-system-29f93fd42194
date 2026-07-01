import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証機能", () => {
  // SCEN-1067: [error] 営業データ品質検証機能 - 営業データから異常値・欠落・矛盾が検出されエラー通知が返される
  test("異常値・欠落・矛盾を含む営業データに対してエラー通知が正常に返される", () => {
    // 異常値を含むデータ：売上金額がマイナス
    const dataWithAbnormalValue = [
      {
        recordId: 1,
        customerName: "顧客A",
        transactionDate: "2024-01-15",
        amount: -50000,
        quantity: 5,
      },
    ];

    const resultAbnormal = validateSalesData(dataWithAbnormalValue);

    expect(resultAbnormal.isValid).toBe(false);
    expect(resultAbnormal.errors).toHaveLength(1);
    expect(resultAbnormal.errors[0].errorCode).toBe("ABNORMAL_VALUE");
    expect(resultAbnormal.errors[0].message).toMatch(/売上金額/);
    expect(resultAbnormal.errors[0].recordId).toBe(1);
    expect(resultAbnormal.errors[0].fieldName).toBe("amount");

    // 欠落データ：必須項目の顧客名が空白
    const dataWithMissingRequired = [
      {
        recordId: 2,
        customerName: "",
        transactionDate: "2024-01-16",
        amount: 100000,
        quantity: 3,
      },
    ];

    const resultMissing = validateSalesData(dataWithMissingRequired);

    expect(resultMissing.isValid).toBe(false);
    expect(resultMissing.errors).toHaveLength(1);
    expect(resultMissing.errors[0].errorCode).toBe("MISSING_REQUIRED");
    expect(resultMissing.errors[0].message).toMatch(/顧客名/);
    expect(resultMissing.errors[0].recordId).toBe(2);
    expect(resultMissing.errors[0].fieldName).toBe("customerName");

    // 欠落データ：取引日が未入力
    const dataWithMissingDate = [
      {
        recordId: 3,
        customerName: "顧客C",
        transactionDate: "",
        amount: 75000,
        quantity: 2,
      },
    ];

    const resultDateMissing = validateSalesData(dataWithMissingDate);

    expect(resultDateMissing.isValid).toBe(false);
    expect(resultDateMissing.errors).toHaveLength(1);
    expect(resultDateMissing.errors[0].errorCode).toBe("MISSING_REQUIRED");
    expect(resultDateMissing.errors[0].message).toMatch(/取引日/);
    expect(resultDateMissing.errors[0].recordId).toBe(3);
    expect(resultDateMissing.errors[0].fieldName).toBe("transactionDate");

    // 矛盾データ：商品数が0以下
    const dataWithContradiction = [
      {
        recordId: 4,
        customerName: "顧客D",
        transactionDate: "2024-01-17",
        amount: 50000,
        quantity: 0,
      },
    ];

    const resultContradiction = validateSalesData(dataWithContradiction);

    expect(resultContradiction.isValid).toBe(false);
    expect(resultContradiction.errors).toHaveLength(1);
    expect(resultContradiction.errors[0].errorCode).toBe("INVALID_RANGE");
    expect(resultContradiction.errors[0].message).toMatch(/数量/);
    expect(resultContradiction.errors[0].recordId).toBe(4);
    expect(resultContradiction.errors[0].fieldName).toBe("quantity");

    // 複合エラー：複数の欠落・異常値が同時に存在
    const dataWithMultipleErrors = [
      {
        recordId: 5,
        customerName: "",
        transactionDate: "2024-01-18",
        amount: -100000,
        quantity: -1,
      },
    ];

    const resultMultiple = validateSalesData(dataWithMultipleErrors);

    expect(resultMultiple.isValid).toBe(false);
    expect(resultMultiple.errors.length).toBeGreaterThanOrEqual(3);

    const errorCodes = resultMultiple.errors.map((e) => e.errorCode);
    expect(errorCodes).toContain("MISSING_REQUIRED");
    expect(errorCodes).toContain("ABNORMAL_VALUE");
    expect(errorCodes).toContain("INVALID_RANGE");

    const recordIds = resultMultiple.errors.map((e) => e.recordId);
    expect(recordIds).toEqual(expect.arrayContaining([5, 5, 5]));

    // 成功ケース：有効なデータ
    const validData = [
      {
        recordId: 6,
        customerName: "顧客E",
        transactionDate: "2024-01-19",
        amount: 150000,
        quantity: 10,
      },
    ];

    const resultValid = validateSalesData(validData);

    expect(resultValid.isValid).toBe(true);
    expect(resultValid.errors).toHaveLength(0);
  });
});