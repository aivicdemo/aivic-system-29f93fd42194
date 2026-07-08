import { calculateAccuracyMetricsByAppraiser } from "../../src/logic/it-6-2-1-1";

describe("月次査定精度指標自動集計機能", () => {
  // SCEN-799
  test("査定員別・工種別・金額帯別の判定精度指標が正確に集計される", () => {
    // テスト用の査定データ
    const assessmentData = [
      {
        appraiser_id: "APP001",
        construction_type: "建築",
        amount_band: "1000万以上2000万未満",
        total_assessments: 10,
        correct_assessments: 9,
        deviation_rate: 0.05,
        assessment_date: "2024-01-15",
      },
      {
        appraiser_id: "APP001",
        construction_type: "建築",
        amount_band: "1000万以上2000万未満",
        total_assessments: 8,
        correct_assessments: 7,
        deviation_rate: 0.08,
        assessment_date: "2024-01-20",
      },
      {
        appraiser_id: "APP001",
        construction_type: "土木",
        amount_band: "500万以上1000万未満",
        total_assessments: 12,
        correct_assessments: 10,
        deviation_rate: 0.12,
        assessment_date: "2024-01-25",
      },
      {
        appraiser_id: "APP002",
        construction_type: "建築",
        amount_band: "1000万以上2000万未満",
        total_assessments: 15,
        correct_assessments: 14,
        deviation_rate: 0.03,
        assessment_date: "2024-01-10",
      },
      {
        appraiser_id: "APP002",
        construction_type: "土木",
        amount_band: "1000万以上2000万未満",
        total_assessments: 11,
        correct_assessments: 9,
        deviation_rate: 0.15,
        assessment_date: "2024-01-22",
      },
      {
        appraiser_id: "APP003",
        construction_type: "建築",
        amount_band: "500万以上1000万未満",
        total_assessments: 9,
        correct_assessments: 8,
        deviation_rate: 0.07,
        assessment_date: "2024-01-18",
      },
    ];

    const aggregation_month = "2024-01";

    const result = calculateAccuracyMetricsByAppraiser({
      assessment_data: assessmentData,
      aggregation_month: aggregation_month,
    });

    // APP001の精度指標検証
    const app001_metrics = result.appraiser_metrics.find(
      (m) => m.appraiser_id === "APP001"
    );
    expect(app001_metrics).toBeDefined();
    expect(app001_metrics?.total_assessments).toBe(30); // 10 + 8 + 12
    expect(app001_metrics?.total_correct_assessments).toBe(26); // 9 + 7 + 10
    expect(app001_metrics?.accuracy_rate).toBe(0.8666666666666667); // 26 / 30

    // APP002の精度指標検証
    const app002_metrics = result.appraiser_metrics.find(
      (m) => m.appraiser_id === "APP002"
    );
    expect(app002_metrics).toBeDefined();
    expect(app002_metrics?.total_assessments).toBe(26); // 15 + 11
    expect(app002_metrics?.total_correct_assessments).toBe(23); // 14 + 9
    expect(app002_metrics?.accuracy_rate).toBe(0.8846153846153846); // 23 / 26

    // APP003の精度指標検証
    const app003_metrics = result.appraiser_metrics.find(
      (m) => m.appraiser_id === "APP003"
    );
    expect(app003_metrics).toBeDefined();
    expect(app003_metrics?.total_assessments).toBe(9);
    expect(app003_metrics?.total_correct_assessments).toBe(8);
    expect(app003_metrics?.accuracy_rate).toBe(0.8888888888888888); // 8 / 9

    // 工種別精度指標検証
    const architecture_metrics = result.construction_type_metrics.find(
      (m) => m.construction_type === "建築"
    );
    expect(architecture_metrics).toBeDefined();
    expect(architecture_metrics?.total_assessments).toBe(42); // 10+8+15+9
    expect(architecture_metrics?.total_correct_assessments).toBe(38); // 9+7+14+8
    expect(architecture_metrics?.accuracy_rate).toBe(0.9047619047619048); // 38 / 42

    const civil_metrics = result.construction_type_metrics.find(
      (m) => m.construction_type === "土木"
    );
    expect(civil_metrics).toBeDefined();
    expect(civil_metrics?.total_assessments).toBe(23); // 12 + 11
    expect(civil_metrics?.total_correct_assessments).toBe(19); // 10 + 9
    expect(civil_metrics?.accuracy_rate).toBe(0.8260869565217391); // 19 / 23

    // 金額帯別精度指標検証
    const amount_band_1000_2000 = result.amount_band_metrics.find(
      (m) => m.amount_band === "1000万以上2000万未満"
    );
    expect(amount_band_1000_2000).toBeDefined();
    expect(amount_band_1000_2000?.total_assessments).toBe(44); // 10+8+15+11
    expect(amount_band_1000_2000?.total_correct_assessments).toBe(40); // 9+7+14+9
    expect(amount_band_1000_2000?.accuracy_rate).toBe(0.9090909090909091); // 40 / 44

    const amount_band_500_1000 = result.amount_band_metrics.find(
      (m) => m.amount_band === "500万以上1000万未満"
    );
    expect(amount_band_500_1000).toBeDefined();
    expect(amount_band_500_1000?.total_assessments).toBe(21); // 12 + 9
    expect(amount_band_500_1000?.total_correct_assessments).toBe(18); // 10 + 8
    expect(amount_band_500_1000?.accuracy_rate).toBe(0.8571428571428571); // 18 / 21

    // 全体精度指標検証
    expect(result.overall_metrics.total_assessments).toBe(65); // 30+26+9
    expect(result.overall_metrics.total_correct_assessments).toBe(57); // 26+23+8
    expect(result.overall_metrics.accuracy_rate).toBe(
      0.8769230769230769
    ); // 57 / 65

    // 平均偏差率の検証
    const avg_deviation_rate =
      (0.05 + 0.08 + 0.12 + 0.03 + 0.15 + 0.07) / 6;
    expect(result.overall_metrics.average_deviation_rate).toBe(
      0.08333333333333333
    ); // 平均

    // 集計対象月の検証
    expect(result.aggregation_month).toBe("2024-01");

    // 構造の完全性検証
    expect(result.appraiser_metrics.length).toBe(3);
    expect(result.construction_type_metrics.length).toBe(2);
    expect(result.amount_band_metrics.length).toBe(2);

    // 各メトリクスの精度率が0～1の範囲内であることを検証
    result.appraiser_metrics.forEach((metric) => {
      expect(metric.accuracy_rate).toBeGreaterThanOrEqual(0);
      expect(metric.accuracy_rate).toBeLessThanOrEqual(1);
    });

    result.construction_type_metrics.forEach((metric) => {
      expect(metric.accuracy_rate).toBeGreaterThanOrEqual(0);
      expect(metric.accuracy_rate).toBeLessThanOrEqual(1);
    });

    result.amount_band_metrics.forEach((metric) => {
      expect(metric.accuracy_rate).toBeGreaterThanOrEqual(0);
      expect(metric.accuracy_rate).toBeLessThanOrEqual(1);
    });

    // 平均偏差率が0～1の範囲内であることを検証
    expect(result.overall_metrics.average_deviation_rate).toBeGreaterThanOrEqual(
      0
    );
    expect(result.overall_metrics.average_deviation_rate).toBeLessThanOrEqual(1);

    // 異なる集計条件での再実行検証（同じデータで再実行）
    const result2 = calculateAccuracyMetricsByAppraiser({
      assessment_data: assessmentData,
      aggregation_month: aggregation_month,
    });

    // 結果の整合性検証
    expect(result2.overall_metrics.total_assessments).toBe(
      result.overall_metrics.total_assessments
    );
    expect(result2.overall_metrics.total_correct_assessments).toBe(
      result.overall_metrics.total_correct_assessments
    );
    expect(result2.overall_metrics.accuracy_rate).toBe(
      result.overall_metrics.accuracy_rate
    );
    expect(result2.appraiser_metrics.length).toBe(
      result.appraiser_metrics.length
    );
  });
});