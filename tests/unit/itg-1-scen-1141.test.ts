import { validateAggregationByMetadata } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1141
  test("メタデータで定義されているデータ型が実際の営業データと不一致の場合、型変換エラーが検出される", () => {
    const metadata = {
      fields: [
        {
          fieldName: "売上金額",
          dataType: "Number",
          unit: "円",
          required: true,
        },
        {
          fieldName: "商品名",
          dataType: "String",
          unit: "テキスト",
          required: true,
        },
      ],
    };

    const salesData = [
      {
        row: 1,
        売上金額: "123abc",
        商品名: "商品A",
      },
    ];

    const result = validateAggregationByMetadata({
      metadata: metadata,
      data: salesData,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const typeError = result.errors[0];
    expect(typeError.errorType).toMatch(/TypeError|DataTypeConversionError/);
    expect(typeError.fieldName).toBe("売上金額");
    expect(typeError.expectedType).toBe("Number");
    expect(typeError.actualValue).toBe("123abc");
    expect(typeError.rowNumber).toBe(1);
    expect(typeError.message).toMatch(/売上金額/);
  });
});