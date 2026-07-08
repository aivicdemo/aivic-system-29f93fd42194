import { identifyPrecisionDeclineCauses, determineCustomizationScope } from "../../src/logic/it-6-2-2-2";

describe("精度低下原因特定・カスタマイズ範囲決定機能", () => {
  test("SCEN-1374: 複数の原因が同時に検出された場合に全原因に対応するカスタマイズ範囲を統合して出力する", () => {
    // 複数の精度低下原因を含むテストデータを準備
    const testData = {
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-03-31",
      ocr_accuracy_before: 0.92,
      ocr_accuracy_after: 0.84,
      ai_judgment_accuracy_before: 0.88,
      ai_judgment_accuracy_after: 0.78,
      learning_data_record_count: 450,
      learning_data_coverage_rate: 0.62,
      model_version_update_date: "2024-01-15",
      external_factor_detected: true,
      external_factor_description: "見積書フォーマット変更",
      regional_bias_detected: true,
      seasonal_variation_not_reflected: true,
      data_quality_score: 0.58,
      model_drift_indicator: 0.71
    };

    // ステップ1: 複数の精度低下原因を特定する
    const identified_causes = identifyPrecisionDeclineCauses(testData);

    // 3件以上の原因が検出されることを確認
    expect(identified_causes.causes.length).toBeGreaterThanOrEqual(3);

    // 検出された原因に以下の3つが含まれていることを確認
    const cause_types = identified_causes.causes.map((c: any) => c.cause_type);
    expect(cause_types).toContain("data_quality_degradation");
    expect(cause_types).toContain("model_drift");
    expect(cause_types).toContain("external_factor");

    // 各原因の詳細情報が構造化されていることを確認
    identified_causes.causes.forEach((cause: any) => {
      expect(cause).toHaveProperty("cause_type");
      expect(cause).toHaveProperty("severity_score");
      expect(cause).toHaveProperty("impact_description");
      expect(cause.severity_score).toBeGreaterThanOrEqual(0);
      expect(cause.severity_score).toBeLessThanOrEqual(100);
    });

    // ステップ2: カスタマイズ範囲を決定する
    const customization_scope = determineCustomizationScope(identified_causes);

    // 統合されたカスタマイズ範囲が出力されることを確認
    expect(customization_scope).toHaveProperty("integrated_customization_items");
    expect(customization_scope.integrated_customization_items).toEqual(
      expect.any(Array)
    );
    expect(customization_scope.integrated_customization_items.length).toBeGreaterThanOrEqual(3);

    // 各原因に対応するカスタマイズ項目が重複なく含まれていることを確認
    const customization_items_set = new Set(
      customization_scope.integrated_customization_items.map((item: any) => item.customization_item_id)
    );
    expect(customization_items_set.size).toBe(customization_scope.integrated_customization_items.length);

    // データ品質低下に対応するカスタマイズ項目が含まれていることを確認
    const has_data_quality_item = customization_scope.integrated_customization_items.some(
      (item: any) => item.target_cause_type === "data_quality_degradation"
    );
    expect(has_data_quality_item).toBe(true);

    // モデル精度低下に対応するカスタマイズ項目が含まれていることを確認
    const has_model_drift_item = customization_scope.integrated_customization_items.some(
      (item: any) => item.target_cause_type === "model_drift"
    );
    expect(has_model_drift_item).toBe(true);

    // 外部要因に対応するカスタマイズ項目が含まれていることを確認
    const has_external_factor_item = customization_scope.integrated_customization_items.some(
      (item: any) => item.target_cause_type === "external_factor"
    );
    expect(has_external_factor_item).toBe(true);

    // 統合結果がJSON形式で出力可能であることを確認
    expect(customization_scope).toHaveProperty("export_format");
    expect(customization_scope.export_format).toBe("json");

    // 出力されたカスタマイズ範囲が全ての検出原因に対応していることを確認
    const covered_cause_types = new Set(
      customization_scope.integrated_customization_items.map((item: any) => item.target_cause_type)
    );
    identified_causes.causes.forEach((cause: any) => {
      expect(covered_cause_types).toContain(cause.cause_type);
    });

    // 統合されたカスタマイズ範囲の各項目が必須フィールドを持つことを確認
    customization_scope.integrated_customization_items.forEach((item: any) => {
      expect(item).toHaveProperty("customization_item_id");
      expect(item).toHaveProperty("target_cause_type");
      expect(item).toHaveProperty("customization_action");
      expect(item).toHaveProperty("priority_score");
      expect(item).toHaveProperty("estimated_implementation_days");
    });

    // 優先度スコアが適切に計算されていることを確認
    customization_scope.integrated_customization_items.forEach((item: any) => {
      expect(item.priority_score).toBeGreaterThanOrEqual(0);
      expect(item.priority_score).toBeLessThanOrEqual(100);
    });

    // 統合スコアが計算されていることを確認
    expect(customization_scope).toHaveProperty("integration_completeness_score");
    expect(customization_scope.integration_completeness_score).toBeGreaterThanOrEqual(0);
    expect(customization_scope.integration_completeness_score).toBeLessThanOrEqual(100);

    // 複数原因が統合されたことを示す情報が含まれていることを確認
    expect(customization_scope).toHaveProperty("total_causes_detected");
    expect(customization_scope.total_causes_detected).toBe(identified_causes.causes.length);

    // エクスポート用の統合結果がJSON文字列として変換可能であることを確認
    const json_output = JSON.stringify(customization_scope.integrated_customization_items);
    expect(json_output).toBeDefined();
    expect(json_output.length).toBeGreaterThan(0);

    // パースして再度検証できることを確認
    const parsed_output = JSON.parse(json_output);
    expect(parsed_output).toEqual(expect.any(Array));
    expect(parsed_output.length).toBe(customization_scope.integrated_customization_items.length);

    // 各カスタマイズ項目が重複していないことを最終確認
    const item_ids = customization_scope.integrated_customization_items.map((item: any) => item.customization_item_id);
    const unique_ids = new Set(item_ids);
    expect(unique_ids.size).toBe(item_ids.length);
  });
});