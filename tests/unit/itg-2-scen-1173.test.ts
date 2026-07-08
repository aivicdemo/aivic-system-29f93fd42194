import { generatePrecisionImprovementVisualization } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1173: 精度改善度可視化 - グラフ生成時に必須パラメータが欠落している場合、生成処理が失敗する", () => {
    // 必須パラメータが完全に揃っている正常系
    const valid_params = {
      evaluation_period_start: "2024-01-01",
      evaluation_period_end: "2024-01-31",
      evaluation_target_category: "ocr_accuracy",
      data_source: "system_logs",
      metric_types: ["precision", "recall"],
    };

    const result_valid = generatePrecisionImprovementVisualization(valid_params);
    expect(result_valid).toEqual({
      graph_id: expect.any(String),
      status: "success",
      graph_type: "line_chart",
      data_points: expect.any(Array),
      timestamp: expect.any(String),
    });
    expect(result_valid.status).toBe("success");
    expect(result_valid.graph_type).toBe("line_chart");

    // 評価期間開始日が欠落している場合
    const missing_period_start = {
      evaluation_period_end: "2024-01-31",
      evaluation_target_category: "ocr_accuracy",
      data_source: "system_logs",
      metric_types: ["precision"],
    };
    expect(() =>
      generatePrecisionImprovementVisualization(missing_period_start as any)
    ).toThrow(/評価期間/);

    // 評価期間終了日が欠落している場合
    const missing_period_end = {
      evaluation_period_start: "2024-01-01",
      evaluation_target_category: "ocr_accuracy",
      data_source: "system_logs",
      metric_types: ["precision"],
    };
    expect(() =>
      generatePrecisionImprovementVisualization(missing_period_end as any)
    ).toThrow(/評価期間/);

    // 評価対象カテゴリが欠落している場合
    const missing_category = {
      evaluation_period_start: "2024-01-01",
      evaluation_period_end: "2024-01-31",
      data_source: "system_logs",
      metric_types: ["precision"],
    };
    expect(() =>
      generatePrecisionImprovementVisualization(missing_category as any)
    ).toThrow(/カテゴリ/);

    // データソースが欠落している場合
    const missing_data_source = {
      evaluation_period_start: "2024-01-01",
      evaluation_period_end: "2024-01-31",
      evaluation_target_category: "ocr_accuracy",
      metric_types: ["precision"],
    };
    expect(() =>
      generatePrecisionImprovementVisualization(missing_data_source as any)
    ).toThrow(/データソース/);

    // メトリクスタイプが欠落している場合
    const missing_metrics = {
      evaluation_period_start: "2024-01-01",
      evaluation_period_end: "2024-01-31",
      evaluation_target_category: "ocr_accuracy",
      data_source: "system_logs",
    };
    expect(() =>
      generatePrecisionImprovementVisualization(missing_metrics as any)
    ).toThrow(/メトリクス/);

    // 複数の必須パラメータが欠落している場合
    const missing_multiple = {
      evaluation_target_category: "ocr_accuracy",
    };
    expect(() =>
      generatePrecisionImprovementVisualization(missing_multiple as any)
    ).toThrow(/パラメータ/);

    // null が渡された場合
    expect(() =>
      generatePrecisionImprovementVisualization(null as any)
    ).toThrow(/パラメータ/);

    // 空オブジェクトが渡された場合
    expect(() =>
      generatePrecisionImprovementVisualization({} as any)
    ).toThrow(/パラメータ/);
  });
});