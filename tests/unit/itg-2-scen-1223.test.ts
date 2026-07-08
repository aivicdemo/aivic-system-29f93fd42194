import {
  calculatePrecisionImprovementMetrics,
} from "../../src/logic/it-1-br-6-2-1";

describe("精度指標の改善度可視化機能", () => {
  test("SCEN-1223: 複数の精度指標の改善度を同時に計測し、改善効果の全体像を可視化する", () => {
    // 入力: 改善度計測リクエスト
    const measurementRequest = {
      measurement_id: "MSR-20240115-001",
      assessor_id: "ASS-0001",
      start_datetime: new Date("2024-01-01T00:00:00Z"),
      end_datetime: new Date("2024-01-15T23:59:59Z"),
      metrics_to_measure: [
        "assessment_accuracy_rate",
        "response_time_minutes",
        "customer_satisfaction_score",
      ],
      baseline_period_start: new Date("2023-12-15T00:00:00Z"),
      baseline_period_end: new Date("2023-12-31T23:59:59Z"),
    };

    // ベースラインメトリクス（期間前）
    const baselineMetrics = {
      assessment_accuracy_rate: 78.5,
      response_time_minutes: 45.2,
      customer_satisfaction_score: 7.2,
    };

    // 現在メトリクス（測定期間中）
    const currentMetrics = {
      assessment_accuracy_rate: 86.3,
      response_time_minutes: 38.5,
      customer_satisfaction_score: 8.6,
    };

    // 関数実行
    const result = calculatePrecisionImprovementMetrics({
      measurement_request: measurementRequest,
      baseline_metrics: baselineMetrics,
      current_metrics: currentMetrics,
    });

    // 期待値の計算
    // 査定精度率: (86.3 - 78.5) / 78.5 * 100 = 9.94%
    const expected_accuracy_improvement_rate = 9.94;
    // 回答時間: (45.2 - 38.5) / 45.2 * 100 = 14.82%（短縮なので改善）
    const expected_time_improvement_rate = 14.82;
    // 顧客満足度: (8.6 - 7.2) / 7.2 * 100 = 19.44%
    const expected_satisfaction_improvement_rate = 19.44;
    // 総合スコア: (9.94 + 14.82 + 19.44) / 3 = 14.73
    const expected_composite_score = 14.73;

    // ✅ 戻り値の構造検証
    expect(result).toHaveProperty("measurement_id");
    expect(result.measurement_id).toBe("MSR-20240115-001");

    // ✅ 各精度指標の改善度が正確に計測されているか
    expect(result).toHaveProperty("metrics_improvement");
    expect(result.metrics_improvement).toHaveLength(3);

    // ✅ 査定精度率の改善度検証
    const accuracy_metric = result.metrics_improvement.find(
      (m: { metric_name: string; improvement_rate: number }) =>
        m.metric_name === "assessment_accuracy_rate"
    );
    expect(accuracy_metric).toBeDefined();
    expect(accuracy_metric.improvement_rate).toBeCloseTo(
      expected_accuracy_improvement_rate,
      1
    );
    expect(accuracy_metric.baseline_value).toBe(78.5);
    expect(accuracy_metric.current_value).toBe(86.3);

    // ✅ 回答時間の改善度検証
    const time_metric = result.metrics_improvement.find(
      (m: { metric_name: string; improvement_rate: number }) =>
        m.metric_name === "response_time_minutes"
    );
    expect(time_metric).toBeDefined();
    expect(time_metric.improvement_rate).toBeCloseTo(
      expected_time_improvement_rate,
      1
    );
    expect(time_metric.baseline_value).toBe(45.2);
    expect(time_metric.current_value).toBe(38.5);

    // ✅ 顧客満足度の改善度検証
    const satisfaction_metric = result.metrics_improvement.find(
      (m: { metric_name: string; improvement_rate: number }) =>
        m.metric_name === "customer_satisfaction_score"
    );
    expect(satisfaction_metric).toBeDefined();
    expect(satisfaction_metric.improvement_rate).toBeCloseTo(
      expected_satisfaction_improvement_rate,
      1
    );
    expect(satisfaction_metric.baseline_value).toBe(7.2);
    expect(satisfaction_metric.current_value).toBe(8.6);

    // ✅ 総合スコアの検証
    expect(result).toHaveProperty("composite_improvement_score");
    expect(result.composite_improvement_score).toBeCloseTo(
      expected_composite_score,
      1
    );

    // ✅ 指標間の相関関係データが存在するか
    expect(result).toHaveProperty("metric_correlation_data");
    expect(Array.isArray(result.metric_correlation_data)).toBe(true);
    expect(result.metric_correlation_data.length).toBeGreaterThan(0);

    // 相関関係マトリクスの検証（例：精度と満足度の相関）
    const accuracy_satisfaction_correlation = result.metric_correlation_data.find(
      (c: { metric_pair: string[]; correlation_coefficient: number }) =>
        (c.metric_pair[0] === "assessment_accuracy_rate" &&
          c.metric_pair[1] === "customer_satisfaction_score") ||
        (c.metric_pair[0] === "customer_satisfaction_score" &&
          c.metric_pair[1] === "assessment_accuracy_rate")
    );
    expect(accuracy_satisfaction_correlation).toBeDefined();
    expect(accuracy_satisfaction_correlation.correlation_coefficient).toBeGreaterThanOrEqual(
      -1
    );
    expect(accuracy_satisfaction_correlation.correlation_coefficient).toBeLessThanOrEqual(1);

    // ✅ ダッシュボード可視化データが正しい形式で生成されているか
    expect(result).toHaveProperty("dashboard_visualization_data");
    expect(result.dashboard_visualization_data).toHaveProperty(
      "line_chart_data"
    );
    expect(result.dashboard_visualization_data).toHaveProperty("bar_chart_data");
    expect(result.dashboard_visualization_data).toHaveProperty(
      "correlation_heatmap_data"
    );

    // ✅ 折れ線グラフデータの検証
    const line_chart = result.dashboard_visualization_data.line_chart_data;
    expect(line_chart).toHaveProperty("series");
    expect(Array.isArray(line_chart.series)).toBe(true);
    expect(line_chart.series.length).toBe(3); // 3つの指標

    // ✅ 棒グラフデータの検証
    const bar_chart = result.dashboard_visualization_data.bar_chart_data;
    expect(bar_chart).toHaveProperty("data_points");
    expect(Array.isArray(bar_chart.data_points)).toBe(true);
    expect(bar_chart.data_points.length).toBe(3);

    // 棒グラフの各データポイントが改善率を正しく表示しているか
    const accuracy_bar = bar_chart.data_points.find(
      (d: { metric_name: string; value: number }) =>
        d.metric_name === "assessment_accuracy_rate"
    );
    expect(accuracy_bar).toBeDefined();
    expect(accuracy_bar.value).toBeCloseTo(expected_accuracy_improvement_rate, 1);

    // ✅ 相関ヒートマップデータの検証
    const heatmap = result.dashboard_visualization_data.correlation_heatmap_data;
    expect(heatmap).toHaveProperty("matrix");
    expect(Array.isArray(heatmap.matrix)).toBe(true);
    expect(heatmap.matrix.length).toBe(3);
    expect(heatmap.matrix[0].length).toBe(3);

    // ✅ ホバー時の詳細情報が利用可能か
    expect(result).toHaveProperty("hover_detail_data");
    expect(Array.isArray(result.hover_detail_data)).toBe(true);
    expect(result.hover_detail_data.length).toBeGreaterThanOrEqual(3);

    // ホバー詳細データの各要素が必須フィールドを持つか
    result.hover_detail_data.forEach(
      (detail: {
        metric_name: string;
        baseline_value: number;
        current_value: number;
        improvement_rate: number;
        interpretation: string;
      }) => {
        expect(detail).toHaveProperty("metric_name");
        expect(detail).toHaveProperty("baseline_value");
        expect(detail).toHaveProperty("current_value");
        expect(detail).toHaveProperty("improvement_rate");
        expect(detail).toHaveProperty("interpretation");
      }
    );

    // ✅ エクスポート機能のサポート形式を検証
    expect(result).toHaveProperty("export_capabilities");
    expect(Array.isArray(result.export_capabilities)).toBe(true);
    expect(result.export_capabilities).toContain("CSV");
    expect(result.export_capabilities).toContain("PDF");

    // ✅ エクスポート用データの生成可能性を確認
    expect(result).toHaveProperty("exportable_data");
    expect(result.exportable_data).toHaveProperty("csv_data");
    expect(result.exportable_data).toHaveProperty("pdf_data");
    expect(typeof result.exportable_data.csv_data).toBe("string");
    expect(result.exportable_data.csv_data.length).toBeGreaterThan(0);

    // ✅ 測定のメタデータが記録されているか
    expect(result).toHaveProperty("measurement_metadata");
    expect(result.measurement_metadata.assessment_id).toBe("ASS-0001");
    expect(result.measurement_metadata.measurement_start).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(result.measurement_metadata.measurement_end).toEqual(
      new Date("2024-01-15T23:59:59Z")
    );
    expect(result.measurement_metadata.baseline_start).toEqual(
      new Date("2023-12-15T00:00:00Z")
    );
    expect(result.measurement_metadata.baseline_end).toEqual(
      new Date("2023-12-31T23:59:59Z")
    );

    // ✅ 総合スコアの妥当性確認（0～100の範囲内であることを確認）
    expect(result.composite_improvement_score).toBeGreaterThanOrEqual(0);
    expect(result.composite_improvement_score).toBeLessThanOrEqual(100);

    // ✅ 改善効果の判定レベルが正しく設定されているか
    expect(result).toHaveProperty("improvement_assessment_level");
    const valid_levels = ["excellent", "good", "fair", "needs_improvement"];
    expect(valid_levels).toContain(result.improvement_assessment_level);

    // 総合スコアに基づいた判定が正しいか検証
    if (result.composite_improvement_score >= 20) {
      expect(result.improvement_assessment_level).toBe("excellent");
    } else if (result.composite_improvement_score >= 15) {
      expect(result.improvement_assessment_level).toBe("good");
    } else if (result.composite_improvement_score >= 10) {
      expect(result.improvement_assessment_level).toBe("fair");
    } else {
      expect(result.improvement_assessment_level).toBe("needs_improvement");
    }

    // ✅ 戻り値全体の必須プロパティが揃っているか最終確認
    expect(result).toHaveProperty("measurement_id");
    expect(result).toHaveProperty("metrics_improvement");
    expect(result).toHaveProperty("composite_improvement_score");
    expect(result).toHaveProperty("metric_correlation_data");
    expect(result).toHaveProperty("dashboard_visualization_data");
    expect(result).toHaveProperty("hover_detail_data");
    expect(result).toHaveProperty("export_capabilities");
    expect(result).toHaveProperty("exportable_data");
    expect(result).toHaveProperty("measurement_metadata");
    expect(result).toHaveProperty("improvement_assessment_level");
  });
});