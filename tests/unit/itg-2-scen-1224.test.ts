import {
  calculateAccuracyImprovementVisualization,
} from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1224: [edge] 精度指標の改善度可視化機能 - 改善前後の計測期間が不足している場合に警告を発して統計的妥当性を確保する
  test("計測期間が統計的妥当性を満たさない場合は警告を表示し、両期間30日以上の場合は警告なしで改善度を表示", () => {
    // ケース1: 改善前の計測期間が30日未満の場合
    const result_pre_insufficient = calculateAccuracyImprovementVisualization({
      pre_measurement_start_date: "2024-01-01",
      pre_measurement_end_date: "2024-01-25",
      post_measurement_start_date: "2024-02-01",
      post_measurement_end_date: "2024-03-01",
      pre_ocr_accuracy: 0.85,
      post_ocr_accuracy: 0.92,
      pre_judgment_accuracy: 0.78,
      post_judgment_accuracy: 0.86,
    });

    expect(result_pre_insufficient.warning_flag).toBe(true);
    expect(result_pre_insufficient.warning_message).toMatch(
      /計測期間が不足しています/
    );
    expect(result_pre_insufficient.warning_message).toMatch(/30日以上/);

    // ケース2: 改善前は30日以上、改善後が30日未満の場合
    const result_post_insufficient = calculateAccuracyImprovementVisualization({
      pre_measurement_start_date: "2024-01-01",
      pre_measurement_end_date: "2024-02-01",
      post_measurement_start_date: "2024-02-02",
      post_measurement_end_date: "2024-02-25",
      pre_ocr_accuracy: 0.85,
      post_ocr_accuracy: 0.92,
      pre_judgment_accuracy: 0.78,
      post_judgment_accuracy: 0.86,
    });

    expect(result_post_insufficient.warning_flag).toBe(true);
    expect(result_post_insufficient.warning_message).toMatch(
      /計測期間が不足しています/
    );

    // ケース3: 改善前後両方が30日未満の場合
    const result_both_insufficient = calculateAccuracyImprovementVisualization({
      pre_measurement_start_date: "2024-01-01",
      pre_measurement_end_date: "2024-01-20",
      post_measurement_start_date: "2024-02-01",
      post_measurement_end_date: "2024-02-20",
      pre_ocr_accuracy: 0.85,
      post_ocr_accuracy: 0.92,
      pre_judgment_accuracy: 0.78,
      post_judgment_accuracy: 0.86,
    });

    expect(result_both_insufficient.warning_flag).toBe(true);
    expect(result_both_insufficient.warning_message).toMatch(
      /計測期間が不足しています/
    );

    // ケース4: 改善前後両方が30日以上の場合（警告なし、改善度の分析結果を表示）
    const result_both_sufficient = calculateAccuracyImprovementVisualization({
      pre_measurement_start_date: "2024-01-01",
      pre_measurement_end_date: "2024-02-01",
      post_measurement_start_date: "2024-02-02",
      post_measurement_end_date: "2024-03-03",
      pre_ocr_accuracy: 0.85,
      post_ocr_accuracy: 0.92,
      pre_judgment_accuracy: 0.78,
      post_judgment_accuracy: 0.86,
    });

    expect(result_both_sufficient.warning_flag).toBe(false);
    expect(result_both_sufficient.warning_message).toBe("");

    // 改善度の計算検証: OCR精度改善率 = (0.92 - 0.85) / 0.85 * 100 = 8.235...%
    expect(result_both_sufficient.ocr_accuracy_improvement_rate).toBeCloseTo(
      8.24,
      1
    );

    // 判定精度改善率 = (0.86 - 0.78) / 0.78 * 100 = 10.256...%
    expect(
      result_both_sufficient.judgment_accuracy_improvement_rate
    ).toBeCloseTo(10.26, 1);

    expect(result_both_sufficient.analysis_result).toBeDefined();
    expect(result_both_sufficient.analysis_result.pre_period_days).toBe(31);
    expect(result_both_sufficient.analysis_result.post_period_days).toBe(30);
    expect(
      result_both_sufficient.analysis_result.statistical_validity
    ).toBe(true);
  });
});