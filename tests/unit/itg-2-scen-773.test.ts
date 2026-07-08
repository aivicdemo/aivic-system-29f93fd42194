import { aggregateAccuracyMetrics } from "../../src/logic/it-6-2-1-1";

describe("OCR精度・AI判定精度監視ダッシュボード", () => {
  test("SCEN-773: 過去30日間のOCR精度とAI判定精度の実績値から精度指標が正常に算出される", () => {
    // 過去30日間のOCR精度実績値（日次）
    const ocr_accuracy_data = [
      { date: "2024-12-17", accuracy: 94.5 },
      { date: "2024-12-18", accuracy: 95.2 },
      { date: "2024-12-19", accuracy: 93.8 },
      { date: "2024-12-20", accuracy: 96.1 },
      { date: "2024-12-21", accuracy: 92.3 },
      { date: "2024-12-22", accuracy: 97.0 },
      { date: "2024-12-23", accuracy: 94.7 },
      { date: "2024-12-24", accuracy: 95.5 },
      { date: "2024-12-25", accuracy: 93.2 },
      { date: "2024-12-26", accuracy: 96.8 },
      { date: "2024-12-27", accuracy: 94.1 },
      { date: "2024-12-28", accuracy: 95.9 },
      { date: "2024-12-29", accuracy: 92.6 },
      { date: "2024-12-30", accuracy: 97.3 },
      { date: "2024-12-31", accuracy: 93.5 },
      { date: "2025-01-01", accuracy: 96.4 },
      { date: "2025-01-02", accuracy: 94.9 },
      { date: "2025-01-03", accuracy: 95.1 },
      { date: "2025-01-04", accuracy: 92.8 },
      { date: "2025-01-05", accuracy: 97.2 },
      { date: "2025-01-06", accuracy: 93.9 },
      { date: "2025-01-07", accuracy: 96.0 },
      { date: "2025-01-08", accuracy: 94.3 },
      { date: "2025-01-09", accuracy: 95.6 },
      { date: "2025-01-10", accuracy: 92.1 },
      { date: "2025-01-11", accuracy: 97.5 },
      { date: "2025-01-12", accuracy: 93.7 },
      { date: "2025-01-13", accuracy: 96.2 },
      { date: "2025-01-14", accuracy: 94.5 },
      { date: "2025-01-15", accuracy: 95.8 },
    ];

    // 過去30日間のAI判定精度実績値（日次）
    const ai_judgment_accuracy_data = [
      { date: "2024-12-17", accuracy: 91.2 },
      { date: "2024-12-18", accuracy: 92.5 },
      { date: "2024-12-19", accuracy: 90.3 },
      { date: "2024-12-20", accuracy: 93.8 },
      { date: "2024-12-21", accuracy: 89.5 },
      { date: "2024-12-22", accuracy: 94.1 },
      { date: "2024-12-23", accuracy: 91.7 },
      { date: "2024-12-24", accuracy: 92.9 },
      { date: "2024-12-25", accuracy: 90.1 },
      { date: "2024-12-26", accuracy: 93.5 },
      { date: "2024-12-27", accuracy: 91.0 },
      { date: "2024-12-28", accuracy: 92.3 },
      { date: "2024-12-29", accuracy: 89.8 },
      { date: "2024-12-30", accuracy: 94.2 },
      { date: "2024-12-31", accuracy: 90.9 },
      { date: "2025-01-01", accuracy: 93.4 },
      { date: "2025-01-02", accuracy: 91.6 },
      { date: "2025-01-03", accuracy: 92.1 },
      { date: "2025-01-04", accuracy: 89.7 },
      { date: "2025-01-05", accuracy: 94.0 },
      { date: "2025-01-06", accuracy: 90.5 },
      { date: "2025-01-07", accuracy: 93.2 },
      { date: "2025-01-08", accuracy: 91.3 },
      { date: "2025-01-09", accuracy: 92.7 },
      { date: "2025-01-10", accuracy: 89.2 },
      { date: "2025-01-11", accuracy: 94.6 },
      { date: "2025-01-12", accuracy: 90.7 },
      { date: "2025-01-13", accuracy: 93.1 },
      { date: "2025-01-14", accuracy: 91.4 },
      { date: "2025-01-15", accuracy: 92.8 },
    ];

    const report_timestamp = "2025-01-15T09:00:00Z";

    // 関数実行
    const result = aggregateAccuracyMetrics(
      ocr_accuracy_data,
      ai_judgment_accuracy_data,
      report_timestamp
    );

    // OCR精度の平均値を計算：
    // (94.5 + 95.2 + 93.8 + 96.1 + 92.3 + 97.0 + 94.7 + 95.5 + 93.2 + 96.8 + 94.1 + 95.9 + 92.6 + 97.3 + 93.5 + 96.4 + 94.9 + 95.1 + 92.8 + 97.2 + 93.9 + 96.0 + 94.3 + 95.6 + 92.1 + 97.5 + 93.7 + 96.2 + 94.5 + 95.8) / 30
    // = 2845.0 / 30 = 94.833...
    const ocr_avg_expected = 94.83;

    // OCR精度の最小値
    const ocr_min_expected = 92.1;

    // OCR精度の最大値
    const ocr_max_expected = 97.5;

    // AI判定精度の平均値を計算：
    // (91.2 + 92.5 + 90.3 + 93.8 + 89.5 + 94.1 + 91.7 + 92.9 + 90.1 + 93.5 + 91.0 + 92.3 + 89.8 + 94.2 + 90.9 + 93.4 + 91.6 + 92.1 + 89.7 + 94.0 + 90.5 + 93.2 + 91.3 + 92.7 + 89.2 + 94.6 + 90.7 + 93.1 + 91.4 + 92.8) / 30
    // = 2749.5 / 30 = 91.65
    const ai_avg_expected = 91.65;

    // AI判定精度の最小値
    const ai_min_expected = 89.2;

    // AI判定精度の最大値
    const ai_max_expected = 94.6;

    // OCR精度指標の検証
    expect(result.ocr_metrics.average).toBeCloseTo(ocr_avg_expected, 2);
    expect(result.ocr_metrics.minimum).toBe(ocr_min_expected);
    expect(result.ocr_metrics.maximum).toBe(ocr_max_expected);

    // AI判定精度指標の検証
    expect(result.ai_judgment_metrics.average).toBeCloseTo(ai_avg_expected, 2);
    expect(result.ai_judgment_metrics.minimum).toBe(ai_min_expected);
    expect(result.ai_judgment_metrics.maximum).toBe(ai_max_expected);

    // レポート更新タイムスタンプの検証
    expect(result.dashboard_update_timestamp).toBe(report_timestamp);

    // ダッシュボードデータ構造の検証
    expect(result).toHaveProperty("ocr_metrics");
    expect(result).toHaveProperty("ai_judgment_metrics");
    expect(result).toHaveProperty("dashboard_update_timestamp");

    // OCR精度の標準偏差の検証（計算式の適切性）
    // 標本標準偏差の計算：各値と平均値の差を二乗してから合計し、サンプル数-1で割って平方根
    const ocr_values = ocr_accuracy_data.map((d) => d.accuracy);
    const ocr_deviations = ocr_values.map((v) => Math.pow(v - ocr_avg_expected, 2));
    const ocr_variance = ocr_deviations.reduce((a, b) => a + b, 0) / (ocr_values.length - 1);
    const ocr_std_dev = Math.sqrt(ocr_variance);
    expect(result.ocr_metrics.std_dev).toBeCloseTo(ocr_std_dev, 2);

    // AI判定精度の標準偏差の検証
    const ai_values = ai_judgment_accuracy_data.map((d) => d.accuracy);
    const ai_deviations = ai_values.map((v) => Math.pow(v - ai_avg_expected, 2));
    const ai_variance = ai_deviations.reduce((a, b) => a + b, 0) / (ai_values.length - 1);
    const ai_std_dev = Math.sqrt(ai_variance);
    expect(result.ai_judgment_metrics.std_dev).toBeCloseTo(ai_std_dev, 2);

    // ダッシュボード表示用の可視化データの存在確認
    expect(result).toHaveProperty("visualization_data");
    expect(result.visualization_data).toHaveProperty("ocr_chart_points");
    expect(result.visualization_data).toHaveProperty("ai_chart_points");

    // グラフポイントの数が30日分であることを確認
    expect(result.visualization_data.ocr_chart_points.length).toBe(30);
    expect(result.visualization_data.ai_chart_points.length).toBe(30);

    // グラフポイントの構造確認（日付と精度値を含む）
    result.visualization_data.ocr_chart_points.forEach((point: any) => {
      expect(point).toHaveProperty("date");
      expect(point).toHaveProperty("accuracy");
      expect(typeof point.date).toBe("string");
      expect(typeof point.accuracy).toBe("number");
    });

    result.visualization_data.ai_chart_points.forEach((point: any) => {
      expect(point).toHaveProperty("date");
      expect(point).toHaveProperty("accuracy");
      expect(typeof point.date).toBe("string");
      expect(typeof point.accuracy).toBe("number");
    });

    // 精度指標が許容範囲内（0～100）であることを確認
    expect(result.ocr_metrics.average).toBeGreaterThanOrEqual(0);
    expect(result.ocr_metrics.average).toBeLessThanOrEqual(100);
    expect(result.ai_judgment_metrics.average).toBeGreaterThanOrEqual(0);
    expect(result.ai_judgment_metrics.average).toBeLessThanOrEqual(100);

    // 最小値と最大値の関係性を確認
    expect(result.ocr_metrics.minimum).toBeLessThanOrEqual(
      result.ocr_metrics.average
    );
    expect(result.ocr_metrics.maximum).toBeGreaterThanOrEqual(
      result.ocr_metrics.average
    );
    expect(result.ai_judgment_metrics.minimum).toBeLessThanOrEqual(
      result.ai_judgment_metrics.average
    );
    expect(result.ai_judgment_metrics.maximum).toBeGreaterThanOrEqual(
      result.ai_judgment_metrics.average
    );

    // データ件数が30件であることを確認
    expect(result.data_count).toBe(30);

    // 期間情報の検証
    expect(result.period_start_date).toBe("2024-12-17");
    expect(result.period_end_date).toBe("2025-01-15");
  });
});