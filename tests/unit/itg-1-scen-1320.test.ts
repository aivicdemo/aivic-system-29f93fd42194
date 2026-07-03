import {
  structureHearingResults,
  HearingResult,
  StructuredHearingData,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1320
  test("ヒアリング結果が営業成果指標・データ項目・計算ルール・レポート形式の4要素に分類される", () => {
    // Arrange: テストデータとして営業ヒアリング結果を準備
    const hearingResult: HearingResult = {
      customer_name: "ABC Corporation",
      sales_target: 5000000,
      contract_count: 25,
      achievement_rate: 95,
      customer_satisfaction: 4.5,
      transaction_count: 120,
      average_transaction_value: 41666.67,
      aggregation_method: "monthly_sum",
      calculation_logic: "sales_plus_bonus",
      output_format: "dashboard",
      display_items: ["sales", "contracts", "satisfaction"],
      chart_type: "bar_and_line",
    };

    // Act: ヒアリング結果の構造化処理を実行
    const structuredData: StructuredHearingData =
      structureHearingResults(hearingResult);

    // Assert: 営業成果指標の要素を抽出して確認
    expect(structuredData.performance_indicators).toBeDefined();
    expect(structuredData.performance_indicators.sales_target).toBe(5000000);
    expect(structuredData.performance_indicators.contract_count).toBe(25);
    expect(structuredData.performance_indicators.achievement_rate).toBe(95);
    expect(structuredData.performance_indicators.customer_satisfaction).toBe(
      4.5
    );

    // Assert: データ項目の要素を抽出して確認
    expect(structuredData.data_items).toBeDefined();
    expect(structuredData.data_items.customer_name).toBe("ABC Corporation");
    expect(structuredData.data_items.transaction_count).toBe(120);
    expect(structuredData.data_items.average_transaction_value).toBe(
      41666.67
    );

    // Assert: 計算ルールの要素を抽出して確認
    expect(structuredData.calculation_rules).toBeDefined();
    expect(structuredData.calculation_rules.aggregation_method).toBe(
      "monthly_sum"
    );
    expect(structuredData.calculation_rules.calculation_logic).toBe(
      "sales_plus_bonus"
    );

    // Assert: レポート形式の要素を抽出して確認
    expect(structuredData.report_format).toBeDefined();
    expect(structuredData.report_format.output_format).toBe("dashboard");
    expect(structuredData.report_format.display_items).toEqual([
      "sales",
      "contracts",
      "satisfaction",
    ]);
    expect(structuredData.report_format.chart_type).toBe("bar_and_line");

    // Assert: 4つの要素すべてが正しく分類・構造化されていることを検証
    expect(Object.keys(structuredData)).toHaveLength(4);
    expect(structuredData).toHaveProperty("performance_indicators");
    expect(structuredData).toHaveProperty("data_items");
    expect(structuredData).toHaveProperty("calculation_rules");
    expect(structuredData).toHaveProperty("report_format");

    // Assert: 各要素が対応するデータ型で正確に格納されていることを確認
    expect(typeof structuredData.performance_indicators).toBe("object");
    expect(typeof structuredData.data_items).toBe("object");
    expect(typeof structuredData.calculation_rules).toBe("object");
    expect(typeof structuredData.report_format).toBe("object");

    // Assert: performance_indicators の数値型フィールドが正確に格納されていることを確認
    expect(typeof structuredData.performance_indicators.sales_target).toBe(
      "number"
    );
    expect(typeof structuredData.performance_indicators.contract_count).toBe(
      "number"
    );
    expect(typeof structuredData.performance_indicators.achievement_rate).toBe(
      "number"
    );

    // Assert: data_items の文字列型フィールドが正確に格納されていることを確認
    expect(typeof structuredData.data_items.customer_name).toBe("string");
    expect(typeof structuredData.data_items.transaction_count).toBe("number");

    // Assert: calculation_rules の文字列型フィールドが正確に格納されていることを確認
    expect(typeof structuredData.calculation_rules.aggregation_method).toBe(
      "string"
    );
    expect(typeof structuredData.calculation_rules.calculation_logic).toBe(
      "string"
    );

    // Assert: report_format の配列型フィールドが正確に格納されていることを確認
    expect(Array.isArray(structuredData.report_format.display_items)).toBe(
      true
    );
    expect(structuredData.report_format.display_items).toHaveLength(3);
  });
});