import { validateAndMergeMultipleMappings } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1146: [edge] 標準フォーマット変換検証 - 複数の営業データ項目が同一のレポートフォーマット項目にマッピングされる場合、統合ルールが正確に適用される
  test("複数の営業データ項目が同一のレポートフォーマット項目にマッピングされた場合、定義された統合ルール（合算、最大値、最小値、優先度順など）が正確に適用される", () => {
    // ===== テストデータ準備 =====
    // 複数の営業データ項目（sales_amount、revenue_total、income_value）が同一のレポートフォーマット項目（total_revenue）にマッピング
    const mappingConfig = {
      reportFormatItem: "total_revenue",
      sourceDataItems: [
        { name: "sales_amount", dataType: "number", mergeRule: "sum" },
        { name: "revenue_total", dataType: "number", mergeRule: "sum" },
        { name: "income_value", dataType: "number", mergeRule: "sum" },
      ],
      globalMergeRule: "sum",
    };

    const sampleData = {
      sales_amount: 10000,
      revenue_total: 5000,
      income_value: 3000,
    };

    // ===== ハッピーパス: 合算ルール =====
    const resultSum = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: sampleData,
      mergeStrategy: "sum",
    });

    expect(resultSum).toEqual({
      reportItem: "total_revenue",
      value: 18000,
      mergeRule: "sum",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });

    // ===== 最大値ルール =====
    const resultMax = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: sampleData,
      mergeStrategy: "max",
    });

    expect(resultMax).toEqual({
      reportItem: "total_revenue",
      value: 10000,
      mergeRule: "max",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });

    // ===== 最小値ルール =====
    const resultMin = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: sampleData,
      mergeStrategy: "min",
    });

    expect(resultMin).toEqual({
      reportItem: "total_revenue",
      value: 3000,
      mergeRule: "min",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });

    // ===== 優先度順ルール（最初の有効値を選択） =====
    const resultPriority = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: sampleData,
      mergeStrategy: "priority",
    });

    expect(resultPriority).toEqual({
      reportItem: "total_revenue",
      value: 10000,
      mergeRule: "priority",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });

    // ===== エッジケース: null値を含む場合 =====
    const dataWithNull = {
      sales_amount: 10000,
      revenue_total: null,
      income_value: 3000,
    };

    const resultWithNull = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: dataWithNull,
      mergeStrategy: "sum",
    });

    expect(resultWithNull).toEqual({
      reportItem: "total_revenue",
      value: 13000,
      mergeRule: "sum",
      sourceCount: 2,
      isValid: true,
      message: "null値を除外して統合されました",
    });

    // ===== エッジケース: 0値を含む場合 =====
    const dataWithZero = {
      sales_amount: 0,
      revenue_total: 5000,
      income_value: 3000,
    };

    const resultWithZero = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: dataWithZero,
      mergeStrategy: "sum",
    });

    expect(resultWithZero).toEqual({
      reportItem: "total_revenue",
      value: 8000,
      mergeRule: "sum",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });

    // ===== エッジケース: 重複値を含む場合 =====
    const dataWithDuplicate = {
      sales_amount: 5000,
      revenue_total: 5000,
      income_value: 5000,
    };

    const resultWithDuplicate = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: dataWithDuplicate,
      mergeStrategy: "sum",
    });

    expect(resultWithDuplicate).toEqual({
      reportItem: "total_revenue",
      value: 15000,
      mergeRule: "sum",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });

    // ===== エッジケース: すべてnull =====
    const dataAllNull = {
      sales_amount: null,
      revenue_total: null,
      income_value: null,
    };

    const resultAllNull = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: dataAllNull,
      mergeStrategy: "sum",
    });

    expect(resultAllNull).toEqual({
      reportItem: "total_revenue",
      value: 0,
      mergeRule: "sum",
      sourceCount: 0,
      isValid: true,
      message: "すべてのソースがnullであり、デフォルト値0が適用されました",
    });

    // ===== エラーケース: マッピング設定が不正 =====
    expect(() =>
      validateAndMergeMultipleMappings({
        mappingConfig: {
          reportFormatItem: "",
          sourceDataItems: [],
          globalMergeRule: "sum",
        },
        inputData: sampleData,
        mergeStrategy: "sum",
      })
    ).toThrow(/マッピング設定/);

    // ===== エラーケース: マージ戦略が不正 =====
    expect(() =>
      validateAndMergeMultipleMappings({
        mappingConfig,
        inputData: sampleData,
        mergeStrategy: "invalid_strategy" as any,
      })
    ).toThrow(/マージ戦略/);

    // ===== エラーケース: 入力データが不正な型 =====
    expect(() =>
      validateAndMergeMultipleMappings({
        mappingConfig,
        inputData: {
          sales_amount: "not_a_number",
          revenue_total: 5000,
          income_value: 3000,
        } as any,
        mergeStrategy: "sum",
      })
    ).toThrow(/データ型/);

    // ===== ログ検証: 統合処理がトレース可能であることを確認 =====
    const resultWithLog = validateAndMergeMultipleMappings({
      mappingConfig,
      inputData: sampleData,
      mergeStrategy: "sum",
    });

    expect(resultWithLog.message).toContain("統合");
    expect(resultWithLog.sourceCount).toBe(3);
    expect(resultWithLog.isValid).toBe(true);

    // ===== 複数マッピング構成: 異なるマージルールの混合 =====
    const complexMappingConfig = {
      reportFormatItem: "total_revenue",
      sourceDataItems: [
        { name: "sales_amount", dataType: "number", mergeRule: "sum" },
        { name: "revenue_total", dataType: "number", mergeRule: "sum" },
        { name: "bonus_amount", dataType: "number", mergeRule: "max" },
      ],
      globalMergeRule: "sum",
    };

    const complexData = {
      sales_amount: 10000,
      revenue_total: 5000,
      bonus_amount: 2000,
    };

    const resultComplex = validateAndMergeMultipleMappings({
      mappingConfig: complexMappingConfig,
      inputData: complexData,
      mergeStrategy: "sum",
    });

    expect(resultComplex).toEqual({
      reportItem: "total_revenue",
      value: 17000,
      mergeRule: "sum",
      sourceCount: 3,
      isValid: true,
      message: "正常に統合されました",
    });
  });
});