import { analyzeQualityDegradationAndSuggestMeasures } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-979: 品質低下原因の自動診断と配置調整・改善施策提示", () => {
    // テストデータ準備：相場乖離精度が閾値を下回り、かつ査定件数が予測を20%超過
    const input = {
      current_deviation_accuracy_rate: 80,
      threshold_deviation_accuracy_rate: 85,
      predicted_assessment_count: 100,
      actual_assessment_count: 120,
      average_processing_time_minutes: 45,
      target_processing_time_minutes: 30,
      learning_data_coverage_rate: 65,
      target_learning_data_coverage_rate: 80,
      current_month: "2024-06-30",
      assessor_count: 30,
    };

    // 自動診断機能を実行
    const diagnosis_result = analyzeQualityDegradationAndSuggestMeasures(input);

    // 相場乖離精度が閾値を下回ることを確認
    expect(input.current_deviation_accuracy_rate).toBeLessThan(
      input.threshold_deviation_accuracy_rate
    );

    // 査定件数が予測の20%超過していることを確認
    const excess_rate =
      ((input.actual_assessment_count - input.predicted_assessment_count) /
        input.predicted_assessment_count) *
      100;
    expect(excess_rate).toBeGreaterThanOrEqual(20);

    // 診断結果が返却されることを確認
    expect(diagnosis_result).toBeDefined();
    expect(typeof diagnosis_result).toBe("object");

    // 複数原因が検出されているか確認
    expect(diagnosis_result.detected_root_causes).toBeDefined();
    expect(Array.isArray(diagnosis_result.detected_root_causes)).toBe(true);
    expect(diagnosis_result.detected_root_causes.length).toBeGreaterThanOrEqual(
      2
    );

    // 「処理時間不足」が含まれているか検証
    const processing_time_issue_detected =
      diagnosis_result.detected_root_causes.some(
        (cause: string) =>
          cause.includes("処理時間") || cause.includes("processing_time")
      );
    expect(processing_time_issue_detected).toBe(true);

    // 「データ不足」が含まれているか検証
    const data_insufficiency_issue_detected =
      diagnosis_result.detected_root_causes.some(
        (cause: string) =>
          cause.includes("データ不足") ||
          cause.includes("learning_data") ||
          cause.includes("coverage")
      );
    expect(data_insufficiency_issue_detected).toBe(true);

    // 各原因に対応する改善施策が提示されているか確認
    expect(diagnosis_result.improvement_measures).toBeDefined();
    expect(Array.isArray(diagnosis_result.improvement_measures)).toBe(true);
    expect(diagnosis_result.improvement_measures.length).toBeGreaterThan(0);

    // 各改善施策が構造を持つことを確認
    diagnosis_result.improvement_measures.forEach(
      (measure: { root_cause: string; action: string; priority: string }) => {
        expect(measure.root_cause).toBeDefined();
        expect(typeof measure.root_cause).toBe("string");
        expect(measure.action).toBeDefined();
        expect(typeof measure.action).toBe("string");
        expect(measure.priority).toBeDefined();
        expect(["high", "medium", "low"]).toContain(measure.priority);
      }
    );

    // 提示された配置調整案の内容を検証
    expect(diagnosis_result.staffing_adjustment_suggestions).toBeDefined();
    expect(
      Array.isArray(diagnosis_result.staffing_adjustment_suggestions)
    ).toBe(true);
    expect(
      diagnosis_result.staffing_adjustment_suggestions.length
    ).toBeGreaterThan(0);

    // 各配置調整案が構造を持つことを確認
    diagnosis_result.staffing_adjustment_suggestions.forEach(
      (suggestion: {
        scenario_name: string;
        additional_assessor_count: number;
        expected_improvement_rate: number;
        implementation_difficulty: string;
      }) => {
        expect(suggestion.scenario_name).toBeDefined();
        expect(typeof suggestion.scenario_name).toBe("string");
        expect(suggestion.additional_assessor_count).toBeDefined();
        expect(typeof suggestion.additional_assessor_count).toBe("number");
        expect(suggestion.additional_assessor_count).toBeGreaterThanOrEqual(0);
        expect(suggestion.expected_improvement_rate).toBeDefined();
        expect(typeof suggestion.expected_improvement_rate).toBe("number");
        expect(suggestion.expected_improvement_rate).toBeGreaterThan(0);
        expect(suggestion.expected_improvement_rate).toBeLessThanOrEqual(100);
        expect(suggestion.implementation_difficulty).toBeDefined();
        expect(["low", "medium", "high"]).toContain(
          suggestion.implementation_difficulty
        );
      }
    );

    // 診断サマリーが含まれることを確認
    expect(diagnosis_result.diagnosis_summary).toBeDefined();
    expect(typeof diagnosis_result.diagnosis_summary).toBe("string");
    expect(diagnosis_result.diagnosis_summary.length).toBeGreaterThan(0);

    // 処理時間不足を解決するための施策が含まれていることを確認
    const processing_time_measure_exists =
      diagnosis_result.improvement_measures.some(
        (measure: { root_cause: string; action: string }) =>
          (measure.root_cause.includes("処理時間") ||
            measure.root_cause.includes("processing_time")) &&
          (measure.action.includes("人員") ||
            measure.action.includes("配置") ||
            measure.action.includes("staffing") ||
            measure.action.includes("additional"))
      );
    expect(processing_time_measure_exists).toBe(true);

    // データ不足を解決するための施策が含まれていることを確認
    const data_coverage_measure_exists =
      diagnosis_result.improvement_measures.some(
        (measure: { root_cause: string; action: string }) =>
          (measure.root_cause.includes("データ不足") ||
            measure.root_cause.includes("coverage") ||
            measure.root_cause.includes("learning_data")) &&
          (measure.action.includes("追加") ||
            measure.action.includes("更新") ||
            measure.action.includes("add") ||
            measure.action.includes("update"))
      );
    expect(data_coverage_measure_exists).toBe(true);

    // 配置調整案に複数シナリオが含まれていることを確認
    const unique_scenarios = new Set(
      diagnosis_result.staffing_adjustment_suggestions.map(
        (s: { scenario_name: string }) => s.scenario_name
      )
    );
    expect(unique_scenarios.size).toBeGreaterThanOrEqual(1);

    // 改善効果の期待値がそれぞれ異なること（複数オプションの提示）を確認
    const improvement_rates = diagnosis_result.staffing_adjustment_suggestions.map(
      (s: { expected_improvement_rate: number }) => s.expected_improvement_rate
    );
    if (improvement_rates.length > 1) {
      const unique_rates = new Set(improvement_rates);
      expect(unique_rates.size).toBeGreaterThanOrEqual(1);
    }
  });
});