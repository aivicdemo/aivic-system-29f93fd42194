import { validateUnifiedFormatConversion } from '../../src/logic/it-1';

describe("入出庫データ統一フォーマット変換機能", () => {
  test("入力方法が未定義の場合に変換エラーが発生する", () => {
    // SCEN-429
    const rawInputData = [
      {
        method: undefined as any,
        departmentId: "DEPT001",
        itemCode: "ITEM001",
        quantity: 100,
        timestamp: "2024-01-15T10:00:00",
        operatorId: "OP001"
      },
      {
        method: "" as any,
        departmentId: "DEPT002", 
        itemCode: "ITEM002",
        quantity: 50,
        timestamp: "2024-01-15T11:00:00",
        operatorId: "OP002"
      }
    ];

    const conversionRules = [
      {
        departmentId: "DEPT001",
        inputMethod: "scanner",
        fieldMapping: {
          itemCode: "itemCode",
          quantity: "quantity"
        }
      },
      {
        departmentId: "DEPT002",
        inputMethod: "manual",
        fieldMapping: {
          itemCode: "itemCode", 
          quantity: "quantity"
        }
      }
    ];

    const result = validateUnifiedFormatConversion(rawInputData, conversionRules);

    expect(result.isValid).toBe(false);
    expect(result.convertedData).toEqual([]);
    expect(result.validationErrors).toHaveLength(2);
    expect(result.validationErrors[0].errorType).toBe("CONVERSION_RULE_NOT_FOUND");
    expect(result.validationErrors[0].message).toBe("変換ルールが見つかりません");
    expect(result.validationErrors[1].errorType).toBe("CONVERSION_RULE_NOT_FOUND");
    expect(result.validationErrors[1].message).toBe("変換ルールが見つかりません");
  });
});