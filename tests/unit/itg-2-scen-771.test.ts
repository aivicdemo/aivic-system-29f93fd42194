import { describe, test, expect, beforeEach } from "@jest/globals";
import { generateMultipleAllocationScenarios } from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 人員配置シナリオの複数案自動生成機能 - データ期間不足時の警告", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-771: 12ヶ月未満の変動パターンデータを使用した場合の警告メッセージと精度低下
  test("should generate allocation scenarios with warning when variation pattern data is less than 12 months", () => {
    // Arrange: 6ヶ月分の変動パターンデータを準備
    const variationPatternData = [
      {
        month_index: 1,
        forecast_case_count: 450,
        forecast_processing_minutes_per_case: 28,
      },
      {
        month_index: 2,
        forecast_case_count: 520,
        forecast_processing_minutes_per_case: 29,
      },
      {
        month_index: 3,
        forecast_case_count: 610,
        forecast_processing_minutes_per_case: 31,
      },
      {
        month_index: 4,
        forecast_case_count: 480,
        forecast_processing_minutes_per_case: 27,
      },
      {
        month_index: 5,
        forecast_case_count: 510,
        forecast_processing_minutes_per_case: 28,
      },
      {
        month_index: 6,
        forecast_case_count: 590,
        forecast_processing_minutes_per_case: 30,
      },
    ];

    const baseline_staff_count = 30;
    const baseline_avg_processing_minutes = 28;
    const normal_period_threshold_case_count = 500;
    const busy_period_threshold_case_count = 600;

    // Act: 複数案自動生成処理を実行
    const result = generateMultipleAllocationScenarios({
      variation_pattern_data: variationPatternData,
      baseline_staff_count: baseline_staff_count,
      baseline_avg_processing_minutes: baseline_avg_processing_minutes,
      normal_period_threshold_case_count: normal_period_threshold_case_count,
      busy_period_threshold_case_count: busy_period_threshold_case_count,
    });

    // Assert: 警告メッセージが表示されること
    expect(result).toHaveProperty("warning_messages");
    expect(Array.isArray(result.warning_messages)).toBe(true);
    expect(result.warning_messages.length).toBeGreaterThan(0);

    // Assert: 警告メッセージに「12ヶ月未満」「推定精度が低下」の内容が含まれること
    const warning_message_text = result.warning_messages[0].message;
    expect(warning_message_text).toMatch(/12ヶ月未満/);
    expect(warning_message_text).toMatch(/推定精度が低下/);

    // Assert: 警告レベルが「注意」以上として記録されること
    expect(result.warning_messages[0].severity_level).toMatch(/注意|警告|要注意/);

    // Assert: 生成された複数案のデータが存在すること
    expect(result).toHaveProperty("generated_scenarios");
    expect(Array.isArray(result.generated_scenarios)).toBe(true);
    expect(result.generated_scenarios.length).toBeGreaterThan(0);

    // Assert: 各シナリオの推定精度指標が通常時よりも低い値で表示されること
    result.generated_scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty("estimation_accuracy_score");
      // 12ヶ月未満データの場合、推定精度スコアは75以下となる（通常は80以上）
      expect(scenario.estimation_accuracy_score).toBeLessThanOrEqual(75);
      expect(scenario.estimation_accuracy_score).toBeGreaterThanOrEqual(50);
    });

    // Assert: シナリオの基本構造を確認
    result.generated_scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty("scenario_id");
      expect(scenario).toHaveProperty("scenario_name");
      expect(scenario).toHaveProperty("required_staff_count");
      expect(scenario).toHaveProperty("support_staff_count");
      expect(scenario).toHaveProperty("support_request_trigger_day");
      expect(scenario).toHaveProperty("feasibility_assessment");
      expect(scenario).toHaveProperty("quality_maintenance_outlook");
      expect(scenario).toHaveProperty("cost_estimate");
      expect(scenario).toHaveProperty("risk_factors");
    });

    // Assert: 推定精度指標が複数案ごとに異なる低い値で記録されること
    const accuracy_scores = result.generated_scenarios.map(
      (s) => s.estimation_accuracy_score
    );
    expect(accuracy_scores[0]).toBeLessThanOrEqual(75);
    expect(accuracy_scores[1]).toBeLessThanOrEqual(75);
    if (accuracy_scores.length > 2) {
      expect(accuracy_scores[2]).toBeLessThanOrEqual(75);
    }

    // Assert: データ期間が12ヶ月未満であることがメタデータに記録されること
    expect(result).toHaveProperty("data_quality_metadata");
    expect(result.data_quality_metadata.data_months_available).toBe(6);
    expect(result.data_quality_metadata.data_period_is_sufficient).toBe(false);
  });
});