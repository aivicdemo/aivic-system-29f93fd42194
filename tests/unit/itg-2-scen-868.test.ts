import { aggregateOcrAccuracyByAssessor } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-868: [normal] モデル更新前後精度比較・可視化機能 - モデル更新前後のOCR精度を数値とグラフで比較し、改善度を定量化する
  test("should aggregate and visualize OCR accuracy metrics before and after model update with improvement quantification", () => {
    // 準備：モデル更新前後のOCR精度テストデータを設定
    const assessorA_before = {
      assessor_id: "assessor_001",
      assessor_name: "太郎",
      construction_type: "建築",
      amount_band: "100万～500万",
      test_date: "2024-01-01",
      model_version: "v1.0",
      total_test_images: 100,
      correct_recognitions: 96,
      incorrect_recognitions: 4,
      accuracy_rate: 0.96,
    };

    const assessorA_after = {
      assessor_id: "assessor_001",
      assessor_name: "太郎",
      construction_type: "建築",
      amount_band: "100万～500万",
      test_date: "2024-01-15",
      model_version: "v1.1",
      total_test_images: 100,
      correct_recognitions: 98,
      incorrect_recognitions: 2,
      accuracy_rate: 0.98,
    };

    const assessorB_before = {
      assessor_id: "assessor_002",
      assessor_name: "花子",
      construction_type: "土木",
      amount_band: "500万～1000万",
      test_date: "2024-01-01",
      model_version: "v1.0",
      total_test_images: 100,
      correct_recognitions: 92,
      incorrect_recognitions: 8,
      accuracy_rate: 0.92,
    };

    const assessorB_after = {
      assessor_id: "assessor_002",
      assessor_name: "花子",
      construction_type: "土木",
      amount_band: "500万～1000万",
      test_date: "2024-01-15",
      model_version: "v1.1",
      total_test_images: 100,
      correct_recognitions: 95,
      incorrect_recognitions: 5,
      accuracy_rate: 0.95,
    };

    const assessorC_before = {
      assessor_id: "assessor_003",
      assessor_name: "次郎",
      construction_type: "建築",
      amount_band: "500万～1000万",
      test_date: "2024-01-01",
      model_version: "v1.0",
      total_test_images: 100,
      correct_recognitions: 94,
      incorrect_recognitions: 6,
      accuracy_rate: 0.94,
    };

    const assessorC_after = {
      assessor_id: "assessor_003",
      assessor_name: "次郎",
      construction_type: "建築",
      amount_band: "500万～1000万",
      test_date: "2024-01-15",
      model_version: "v1.1",
      total_test_images: 100,
      correct_recognitions: 97,
      incorrect_recognitions: 3,
      accuracy_rate: 0.97,
    };

    const test_data_before = [assessorA_before, assessorB_before, assessorC_before];
    const test_data_after = [assessorA_after, assessorB_after, assessorC_after];

    // 実行：精度比較実行ボタンをクリック後の集計処理
    const result = aggregateOcrAccuracyByAssessor(test_data_before, test_data_after);

    // 検証：モデル更新前後のOCR精度が数値とグラフで正確に比較表示されることを確認

    // 1. 結果オブジェクトが存在することを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");

    // 2. 査定担当者別の精度指標が集計されていることを確認
    expect(result.by_assessor).toBeDefined();
    expect(Array.isArray(result.by_assessor)).toBe(true);
    expect(result.by_assessor.length).toBe(3);

    // 3. 査定担当者Aの精度比較データを検証
    const assessor_a_metrics = result.by_assessor.find((m: any) => m.assessor_id === "assessor_001");
    expect(assessor_a_metrics).toBeDefined();
    expect(assessor_a_metrics.assessor_name).toBe("太郎");
    expect(assessor_a_metrics.accuracy_before).toBe(0.96);
    expect(assessor_a_metrics.accuracy_after).toBe(0.98);
    // 改善度 = (0.98 - 0.96) / 0.96 * 100 = 2.083...% ≈ 2.08%
    expect(assessor_a_metrics.improvement_rate).toBeCloseTo(2.08, 1);
    // 精度向上値 = 0.98 - 0.96 = 0.02
    expect(assessor_a_metrics.accuracy_gain).toBe(0.02);
    // エラー削減件数 = 4 - 2 = 2件
    expect(assessor_a_metrics.error_reduction_count).toBe(2);

    // 4. 査定担当者Bの精度比較データを検証
    const assessor_b_metrics = result.by_assessor.find((m: any) => m.assessor_id === "assessor_002");
    expect(assessor_b_metrics).toBeDefined();
    expect(assessor_b_metrics.assessor_name).toBe("花子");
    expect(assessor_b_metrics.accuracy_before).toBe(0.92);
    expect(assessor_b_metrics.accuracy_after).toBe(0.95);
    // 改善度 = (0.95 - 0.92) / 0.92 * 100 = 3.26...% ≈ 3.26%
    expect(assessor_b_metrics.improvement_rate).toBeCloseTo(3.26, 1);
    // 精度向上値 = 0.95 - 0.92 = 0.03
    expect(assessor_b_metrics.accuracy_gain).toBe(0.03);
    // エラー削減件数 = 8 - 5 = 3件
    expect(assessor_b_metrics.error_reduction_count).toBe(3);

    // 5. 査定担当者Cの精度比較データを検証
    const assessor_c_metrics = result.by_assessor.find((m: any) => m.assessor_id === "assessor_003");
    expect(assessor_c_metrics).toBeDefined();
    expect(assessor_c_metrics.assessor_name).toBe("次郎");
    expect(assessor_c_metrics.accuracy_before).toBe(0.94);
    expect(assessor_c_metrics.accuracy_after).toBe(0.97);
    // 改善度 = (0.97 - 0.94) / 0.94 * 100 = 3.19...% ≈ 3.19%
    expect(assessor_c_metrics.improvement_rate).toBeCloseTo(3.19, 1);
    // 精度向上値 = 0.97 - 0.94 = 0.03
    expect(assessor_c_metrics.accuracy_gain).toBe(0.03);
    // エラー削減件数 = 6 - 3 = 3件
    expect(assessor_c_metrics.error_reduction_count).toBe(3);

    // 6. 工種別の精度指標が集計されていることを確認
    expect(result.by_construction_type).toBeDefined();
    expect(Array.isArray(result.by_construction_type)).toBe(true);
    expect(result.by_construction_type.length).toBe(2);

    // 7. 建築工種の精度比較データを検証
    const construction_arch = result.by_construction_type.find((c: any) => c.construction_type === "建築");
    expect(construction_arch).toBeDefined();
    // 建築工種のモデル前の平均精度 = (0.96 + 0.94) / 2 = 0.95
    expect(construction_arch.avg_accuracy_before).toBe(0.95);
    // 建築工種のモデル後の平均精度 = (0.98 + 0.97) / 2 = 0.975
    expect(construction_arch.avg_accuracy_after).toBe(0.975);
    // 改善度 = (0.975 - 0.95) / 0.95 * 100 = 2.63...% ≈ 2.63%
    expect(construction_arch.improvement_rate).toBeCloseTo(2.63, 1);

    // 8. 土木工種の精度比較データを検証
    const construction_civil = result.by_construction_type.find((c: any) => c.construction_type === "土木");
    expect(construction_civil).toBeDefined();
    // 土木工種のモデル前の平均精度 = 0.92
    expect(construction_civil.avg_accuracy_before).toBe(0.92);
    // 土木工種のモデル後の平均精度 = 0.95
    expect(construction_civil.avg_accuracy_after).toBe(0.95);
    // 改善度 = (0.95 - 0.92) / 0.92 * 100 = 3.26...% ≈ 3.26%
    expect(construction_civil.improvement_rate).toBeCloseTo(3.26, 1);

    // 9. 金額帯別の精度指標が集計されていることを確認
    expect(result.by_amount_band).toBeDefined();
    expect(Array.isArray(result.by_amount_band)).toBe(true);
    expect(result.by_amount_band.length).toBe(2);

    // 10. 金額帯「100万～500万」の精度比較データを検証
    const amount_band_small = result.by_amount_band.find((a: any) => a.amount_band === "100万～500万");
    expect(amount_band_small).toBeDefined();
    expect(amount_band_small.avg_accuracy_before).toBe(0.96);
    expect(amount_band_small.avg_accuracy_after).toBe(0.98);
    // 改善度 = (0.98 - 0.96) / 0.96 * 100 = 2.08...% ≈ 2.08%
    expect(amount_band_small.improvement_rate).toBeCloseTo(2.08, 1);

    // 11. 金額帯「500万～1000万」の精度比較データを検証
    const amount_band_large = result.by_amount_band.find((a: any) => a.amount_band === "500万～1000万");
    expect(amount_band_large).toBeDefined();
    // 平均精度前 = (0.92 + 0.94) / 2 = 0.93
    expect(amount_band_large.avg_accuracy_before).toBe(0.93);
    // 平均精度後 = (0.95 + 0.97) / 2 = 0.96
    expect(amount_band_large.avg_accuracy_after).toBe(0.96);
    // 改善度 = (0.96 - 0.93) / 0.93 * 100 = 3.22...% ≈ 3.22%
    expect(amount_band_large.improvement_rate).toBeCloseTo(3.22, 1);

    // 12. 全体の集計指標が存在することを確認
    expect(result.overall_metrics).toBeDefined();
    expect(typeof result.overall_metrics).toBe("object");

    // 13. 全体の平均精度（モデル前）を検証
    // 全体平均前 = (0.96 + 0.92 + 0.94) / 3 = 0.9400
    expect(result.overall_metrics.overall_avg_accuracy_before).toBeCloseTo(0.9400, 3);

    // 14. 全体の平均精度（モデル後）を検証
    // 全体平均後 = (0.98 + 0.95 + 0.97) / 3 = 0.9667
    expect(result.overall_metrics.overall_avg_accuracy_after).toBeCloseTo(0.9667, 3);

    // 15. 全体の改善度を検証
    // 全体改善度 = (0.9667 - 0.9400) / 0.9400 * 100 = 2.83...% ≈ 2.83%
    expect(result.overall_metrics.overall_improvement_rate).toBeCloseTo(2.83, 1);

    // 16. グラフデータ（折れ線図・棒グラフ用）が存在することを確認
    expect(result.graph_data).toBeDefined();
    expect(typeof result.graph_data).toBe("object");

    // 17. グラフ凡例が正確に定義されていることを確認
    expect(result.graph_data.legend).toBeDefined();
    expect(Array.isArray(result.graph_data.legend)).toBe(true);
    expect(result.graph_data.legend).toEqual(["モデル前精度", "モデル後精度", "改善度(%)"]);

    // 18. グラフX軸ラベル（査定担当者別）が正確であることを確認
    expect(result.graph_data.x_axis_labels).toBeDefined();
    expect(result.graph_data.x_axis_labels).toEqual(["太郎", "花子", "次郎"]);

    // 19. グラフY軸ラベルと単位が正確であることを確認
    expect(result.graph_data.y_axis_label).toBe("精度 / 改善度");
    expect(result.graph_data.y_axis_unit).toBe("%");

    // 20. グラフデータセット（査定担当者別の精度比較）が正確であることを確認
    expect(result.graph_data.datasets).toBeDefined();
    expect(Array.isArray(result.graph_data.datasets)).toBe(true);
    expect(result.graph_data.datasets.length).toBe(3);

    const dataset_before = result.graph_data.datasets.find((d: any) => d.label === "モデル前精度");
    expect(dataset_before).toBeDefined();
    expect(dataset_before.data).toEqual([96, 92, 94]);

    const dataset_after = result.graph_data.datasets.find((d: any) => d.label === "モデル後精度");
    expect(dataset_after).toBeDefined();
    expect(dataset_after.data).toEqual([98, 95, 97]);

    const dataset_improvement = result.graph_data.datasets.find((d: any) => d.label === "改善度(%)");
    expect(dataset_improvement).toBeDefined();
    expect(dataset_improvement.data[0]).toBeCloseTo(2.08, 1);
    expect(dataset_improvement.data[1]).toBeCloseTo(3.26, 1);
    expect(dataset_improvement.data[2]).toBeCloseTo(3.19, 1);

    // 21. データエクスポート機能の情報が含まれていることを確認
    expect(result.export_info).toBeDefined();
    expect(typeof result.export_info).toBe("object");

    // 22. CSVエクスポート形式で出力可能な形式が含まれていることを確認
    expect(result.export_info.csv_available).toBe(true);
    expect(result.export_info.csv_filename).toBeDefined();
    expect(result.export_info.csv_filename).toMatch(/^model_accuracy_comparison_\d{8}\.csv$/);

    // 23. PDFエクスポート形式で出力可能な形式が含まれていることを確認
    expect(result.export_info.pdf_available).toBe(true);
    expect(result.export_info.pdf_filename).toBeDefined();
    expect(result.export_info.pdf_filename).toMatch(/^model_accuracy_comparison_\d{8}\.pdf$/);

    // 24. エクスポート用の集計データが含まれていることを確認
    expect(result.export_info.summary_data).toBeDefined();
    expect(result.export_info.summary_data.total_assessors).toBe(3);
    expect(result.export_info.summary_data.construction_types_count).toBe(2);
    expect(result.export_info.summary_data.amount_bands_count).toBe(2);

    // 25. レポート生成タイムスタンプが存在することを確認
    expect(result.report_timestamp).toBeDefined();
    expect(typeof result.report_timestamp).toBe("string");
    // ISO形式の日時であることを確認
    expect(result.report_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 26. モデルバージョン情報が含まれていることを確認
    expect(result.model_versions).toBeDefined();
    expect(result.model_versions.before_version).toBe("v1.0");
    expect(result.model_versions.after_version).toBe("v1.1");

    // 27. テスト実施日範囲が記録されていることを確認
    expect(result.test_period).toBeDefined();
    expect(result.test_period.start_date).toBe("2024-01-01");
    expect(result.test_period.end_date).toBe("2024-01-15");

    // 28. 定量指標サマリーが含まれていることを確認
    expect(result.summary_indicators).toBeDefined();
    expect(result.summary_indicators.total_error_reduction).toBe(8); // 2 + 3 + 3
    expect(result.summary_indicators.avg_improvement_rate).toBeCloseTo(2.78, 1); // (2.08 + 3.26 + 3.19) / 3
  });
});