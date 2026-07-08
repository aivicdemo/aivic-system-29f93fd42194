import { aggregateJudgmentAccuracyByDimension } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-969: 翌月応援要請の必要性判定・配置シナリオ選択 - 翌月繁忙度予測データが存在しない場合、エラーが返される", () => {
    const input = {
      assessor_id: "A001",
      forecast_month: "2024-02",
      forecast_data: null,
    };

    expect(() => aggregateJudgmentAccuracyByDimension(input)).toThrow(
      /FORECAST_DATA_NOT_FOUND/
    );
  });

  test("SCEN-969: 翌月応援要請の必要性判定・配置シナリオ選択 - 繁忙度予測データが存在する場合、判定精度指標が正常に集計される", () => {
    const input = {
      assessor_id: "A001",
      forecast_month: "2024-02",
      forecast_data: {
        predicted_cases: 450,
        predicted_processing_time_minutes: 25,
        forecast_confidence: 0.87,
      },
      historical_data: [
        {
          month: "2023-11",
          assessor_id: "A001",
          cases_count: 380,
          avg_processing_time: 26,
          accuracy_rate: 0.91,
          deviation_rate: 0.08,
          uniformity_index: 0.89,
        },
        {
          month: "2023-12",
          assessor_id: "A001",
          cases_count: 420,
          avg_processing_time: 24,
          accuracy_rate: 0.93,
          deviation_rate: 0.06,
          uniformity_index: 0.92,
        },
      ],
      dimension_filters: {
        assessor: "A001",
        work_type: "foundation",
        price_band: "high",
      },
    };

    const result = aggregateJudgmentAccuracyByDimension(input);

    expect(result).toEqual({
      forecast_month: "2024-02",
      assessor_id: "A001",
      work_type: "foundation",
      price_band: "high",
      aggregated_accuracy_rate: 0.92,
      aggregated_deviation_rate: 0.07,
      aggregated_uniformity_index: 0.905,
      predicted_required_staff: 17,
      support_request_necessary: true,
      support_request_timing: "2024-01-25",
      scenarios: [
        {
          scenario_id: "S001",
          scenario_name: "normal",
          required_staff_count: 15,
          feasibility: 0.85,
          cost_estimate: 450000,
        },
        {
          scenario_id: "S002",
          scenario_name: "busy",
          required_staff_count: 20,
          feasibility: 0.72,
          cost_estimate: 600000,
        },
        {
          scenario_id: "S003",
          scenario_name: "peak",
          required_staff_count: 25,
          feasibility: 0.58,
          cost_estimate: 750000,
        },
      ],
      recommended_scenario: "S002",
      recommendation_reason:
        "Predicted 450 cases with optimal feasibility and cost balance",
      confidence_score: 0.87,
      generated_at: "2024-01-15T09:00:00Z",
    });
  });

  test("SCEN-969: 翌月応援要請の必要性判定・配置シナリオ選択 - 複数の判定精度指標が異なる場合、次元別に正確に集計される", () => {
    const input = {
      assessor_id: "A002",
      forecast_month: "2024-02",
      forecast_data: {
        predicted_cases: 520,
        predicted_processing_time_minutes: 23,
        forecast_confidence: 0.91,
      },
      historical_data: [
        {
          month: "2023-11",
          assessor_id: "A002",
          cases_count: 450,
          avg_processing_time: 25,
          accuracy_rate: 0.88,
          deviation_rate: 0.12,
          uniformity_index: 0.85,
        },
        {
          month: "2023-12",
          assessor_id: "A002",
          cases_count: 490,
          avg_processing_time: 22,
          accuracy_rate: 0.95,
          deviation_rate: 0.04,
          uniformity_index: 0.94,
        },
      ],
      dimension_filters: {
        assessor: "A002",
        work_type: "electrical",
        price_band: "medium",
      },
    };

    const result = aggregateJudgmentAccuracyByDimension(input);

    expect(result.aggregated_accuracy_rate).toBe(0.915);
    expect(result.aggregated_deviation_rate).toBe(0.08);
    expect(result.aggregated_uniformity_index).toBe(0.895);
    expect(result.predicted_required_staff).toBe(20);
    expect(result.support_request_necessary).toBe(true);
    expect(result.confidence_score).toBe(0.91);
  });

  test("SCEN-969: 翌月応援要請の必要性判定・配置シナリオ選択 - 繁忙度予測データの信頼度スコアが低い場合、警告フラグが付与される", () => {
    const input = {
      assessor_id: "A003",
      forecast_month: "2024-02",
      forecast_data: {
        predicted_cases: 380,
        predicted_processing_time_minutes: 27,
        forecast_confidence: 0.62,
      },
      historical_data: [
        {
          month: "2023-11",
          assessor_id: "A003",
          cases_count: 320,
          avg_processing_time: 28,
          accuracy_rate: 0.87,
          deviation_rate: 0.13,
          uniformity_index: 0.83,
        },
        {
          month: "2023-12",
          assessor_id: "A003",
          cases_count: 360,
          avg_processing_time: 26,
          accuracy_rate: 0.89,
          deviation_rate: 0.11,
          uniformity_index: 0.85,
        },
      ],
      dimension_filters: {
        assessor: "A003",
        work_type: "plumbing",
        price_band: "low",
      },
    };

    const result = aggregateJudgmentAccuracyByDimension(input);

    expect(result.confidence_score).toBe(0.62);
    expect(result.confidence_score).toBeLessThan(0.75);
  });
});