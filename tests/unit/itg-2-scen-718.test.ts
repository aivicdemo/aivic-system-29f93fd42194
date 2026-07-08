import { aggregateAssessmentAccuracyByDimension } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-718: 見積書必須項目完全性検証 - 工事種別・金額・数量がすべて揃う場合、AI-OCR読取処理へ進む", () => {
    // ===== Arrange: テストデータの準備 =====
    // 査定担当者別の判定結果データ
    const assessor_001_results = [
      {
        assessor_id: "assessor_001",
        construction_type: "鉄骨工事",
        amount_band: "1M-5M",
        deviation_rate: 2.5,
        processing_time_minutes: 15,
        accuracy_score: 95,
      },
      {
        assessor_id: "assessor_001",
        construction_type: "鉄骨工事",
        amount_band: "5M-10M",
        deviation_rate: 3.1,
        processing_time_minutes: 18,
        accuracy_score: 93,
      },
      {
        assessor_id: "assessor_001",
        construction_type: "型枠工事",
        amount_band: "1M-5M",
        deviation_rate: 1.8,
        processing_time_minutes: 12,
        accuracy_score: 97,
      },
    ];

    // 査定担当者別の判定結果データ（経験者）
    const assessor_002_results = [
      {
        assessor_id: "assessor_002",
        construction_type: "鉄骨工事",
        amount_band: "1M-5M",
        deviation_rate: 1.2,
        processing_time_minutes: 14,
        accuracy_score: 98,
      },
      {
        assessor_id: "assessor_002",
        construction_type: "鉄骨工事",
        amount_band: "5M-10M",
        deviation_rate: 0.9,
        processing_time_minutes: 16,
        accuracy_score: 99,
      },
      {
        assessor_id: "assessor_002",
        construction_type: "型枠工事",
        amount_band: "1M-5M",
        deviation_rate: 0.6,
        processing_time_minutes: 11,
        accuracy_score: 99,
      },
    ];

    // 査定担当者別の判定結果データ（新人）
    const assessor_003_results = [
      {
        assessor_id: "assessor_003",
        construction_type: "鉄骨工事",
        amount_band: "1M-5M",
        deviation_rate: 5.2,
        processing_time_minutes: 22,
        accuracy_score: 88,
      },
      {
        assessor_id: "assessor_003",
        construction_type: "鉄骨工事",
        amount_band: "5M-10M",
        deviation_rate: 6.1,
        processing_time_minutes: 25,
        accuracy_score: 85,
      },
      {
        assessor_id: "assessor_003",
        construction_type: "型枠工事",
        amount_band: "1M-5M",
        deviation_rate: 4.3,
        processing_time_minutes: 20,
        accuracy_score: 90,
      },
    ];

    // 全査定担当者のデータを集約
    const all_assessment_results = [
      ...assessor_001_results,
      ...assessor_002_results,
      ...assessor_003_results,
    ];

    // ===== Act: 集計関数を実行 =====
    const aggregation_result = aggregateAssessmentAccuracyByDimension(
      all_assessment_results
    );

    // ===== Assert: 期待値との検証 =====

    // 1. 結果オブジェクトが正しい構造を持つことを確認
    expect(aggregation_result).toHaveProperty("by_assessor");
    expect(aggregation_result).toHaveProperty("by_construction_type");
    expect(aggregation_result).toHaveProperty("by_amount_band");
    expect(aggregation_result).toHaveProperty("ability_gap_analysis");

    // 2. 査定担当者別の集計結果を検証
    // 新人と経験者の能力差を定量的に検証
    const assessor_metrics = aggregation_result.by_assessor;

    // assessor_001（中堅）の平均精度
    const assessor_001_avg_accuracy = (95 + 93 + 97) / 3; // = 95
    expect(assessor_metrics["assessor_001"].avg_accuracy_score).toBe(95);

    // assessor_001（中堅）の平均処理時間
    const assessor_001_avg_time = (15 + 18 + 12) / 3; // = 15
    expect(assessor_metrics["assessor_001"].avg_processing_time_minutes).toBe(
      15
    );

    // assessor_001（中堅）の平均乖離率
    const assessor_001_avg_deviation = (2.5 + 3.1 + 1.8) / 3; // = 2.466...
    expect(
      Math.round(
        assessor_metrics["assessor_001"].avg_deviation_rate * 1000
      ) / 1000
    ).toBe(2.467);

    // assessor_002（経験者）の平均精度
    const assessor_002_avg_accuracy = (98 + 99 + 99) / 3; // = 98.666...
    expect(
      Math.round(
        assessor_metrics["assessor_002"].avg_accuracy_score * 1000
      ) / 1000
    ).toBe(98.667);

    // assessor_002（経験者）の平均処理時間
    const assessor_002_avg_time = (14 + 16 + 11) / 3; // = 13.666...
    expect(
      Math.round(
        assessor_metrics["assessor_002"].avg_processing_time_minutes * 1000
      ) / 1000
    ).toBe(13.667);

    // assessor_003（新人）の平均精度
    const assessor_003_avg_accuracy = (88 + 85 + 90) / 3; // = 87.666...
    expect(
      Math.round(
        assessor_metrics["assessor_003"].avg_accuracy_score * 1000
      ) / 1000
    ).toBe(87.667);

    // assessor_003（新人）の平均処理時間
    const assessor_003_avg_time = (22 + 25 + 20) / 3; // = 22.333...
    expect(
      Math.round(
        assessor_metrics["assessor_003"].avg_processing_time_minutes * 1000
      ) / 1000
    ).toBe(22.333);

    // 3. 工種別の集計結果を検証
    const construction_metrics = aggregation_result.by_construction_type;

    // 鉄骨工事の平均精度
    // assessor_001: 95, 93
    // assessor_002: 98, 99
    // assessor_003: 88, 85
    const steel_avg_accuracy =
      (95 + 93 + 98 + 99 + 88 + 85) / 6; // = 93
    expect(construction_metrics["鉄骨工事"].avg_accuracy_score).toBe(93);

    // 型枠工事の平均精度
    // assessor_001: 97
    // assessor_002: 99
    // assessor_003: 90
    const formwork_avg_accuracy = (97 + 99 + 90) / 3; // = 95.333...
    expect(
      Math.round(
        construction_metrics["型枠工事"].avg_accuracy_score * 1000
      ) / 1000
    ).toBe(95.333);

    // 4. 金額帯別の集計結果を検証
    const amount_metrics = aggregation_result.by_amount_band;

    // 1M-5M金額帯の平均精度
    // assessor_001: 95, 97
    // assessor_002: 98, 99
    // assessor_003: 88, 90
    const band_1m_5m_avg_accuracy =
      (95 + 97 + 98 + 99 + 88 + 90) / 6; // = 94.5
    expect(amount_metrics["1M-5M"].avg_accuracy_score).toBe(94.5);

    // 5M-10M金額帯の平均精度
    // assessor_001: 93
    // assessor_002: 99
    // assessor_003: 85
    const band_5m_10m_avg_accuracy = (93 + 99 + 85) / 3; // = 92.333...
    expect(
      Math.round(
        amount_metrics["5M-10M"].avg_accuracy_score * 1000
      ) / 1000
    ).toBe(92.333);

    // 5. 新人と経験者の能力差分析を検証
    const ability_gap = aggregation_result.ability_gap_analysis;

    // 精度差（経験者 - 新人）: 98.667 - 87.667 = 11
    const precision_gap =
      Math.round(
        (assessor_metrics["assessor_002"].avg_accuracy_score -
          assessor_metrics["assessor_003"].avg_accuracy_score) *
          1000
      ) / 1000;
    expect(ability_gap.accuracy_gap_percentage).toBe(11);

    // 処理時間差（新人 - 経験者）: 22.333 - 13.667 = 8.666...
    const processing_time_gap =
      Math.round(
        (assessor_metrics["assessor_003"].avg_processing_time_minutes -
          assessor_metrics["assessor_002"].avg_processing_time_minutes) *
          1000
      ) / 1000;
    expect(
      Math.round(ability_gap.processing_time_gap_minutes * 1000) / 1000
    ).toBe(8.666);

    // 乖離率差（新人 - 経験者）
    const assessor_002_avg_dev =
      Math.round(
        ((1.2 + 0.9 + 0.6) / 3) * 1000
      ) / 1000; // = 0.9
    const assessor_003_avg_dev =
      Math.round(
        ((5.2 + 6.1 + 4.3) / 3) * 1000
      ) / 1000; // = 5.2
    const deviation_gap =
      Math.round((assessor_003_avg_dev - assessor_002_avg_dev) * 1000) / 1000;
    expect(
      Math.round(ability_gap.deviation_rate_gap_percentage * 1000) / 1000
    ).toBe(4.3);

    // 6. 判定基準が一貫していることを確認
    expect(aggregation_result).toHaveProperty("standardization_indicators");
    const standardization = aggregation_result.standardization_indicators;

    // 同一工種・金額帯での判定のばらつきが記録されている
    // 例：鉄骨工事・1M-5M での3名の精度: 95, 98, 88
    // ばらつき（標準偏差）の計算
    const steel_1m5m_scores = [95, 98, 88];
    const mean_steel_1m5m = (95 + 98 + 88) / 3; // = 93.666...
    const variance =
      ((95 - 93.667) ** 2 +
        (98 - 93.667) ** 2 +
        (88 - 93.667) ** 2) /
      3;
    const std_dev = Math.sqrt(variance); // ≈ 4.163
    expect(
      Math.round(standardization.consistency_std_dev_by_type_band * 1000) / 1000
    ).toBeGreaterThan(4);
    expect(
      Math.round(standardization.consistency_std_dev_by_type_band * 1000) / 1000
    ).toBeLessThan(5);

    // 7. 各構成要素のカウント検証
    expect(aggregation_result.by_assessor).toHaveProperty("assessor_001");
    expect(aggregation_result.by_assessor).toHaveProperty("assessor_002");
    expect(aggregation_result.by_assessor).toHaveProperty("assessor_003");
    expect(Object.keys(aggregation_result.by_assessor).length).toBe(3);

    expect(aggregation_result.by_construction_type).toHaveProperty("鉄骨工事");
    expect(aggregation_result.by_construction_type).toHaveProperty("型枠工事");
    expect(
      Object.keys(aggregation_result.by_construction_type).length
    ).toBe(2);

    expect(aggregation_result.by_amount_band).toHaveProperty("1M-5M");
    expect(aggregation_result.by_amount_band).toHaveProperty("5M-10M");
    expect(Object.keys(aggregation_result.by_amount_band).length).toBe(2);

    // 8. 教育指導の優先度が自動判定されることを確認
    expect(aggregation_result).toHaveProperty(
      "training_priority_recommendation"
    );
    const training_rec =
      aggregation_result.training_priority_recommendation;

    // 新人（assessor_003）を対象とした教育が高優先度として推奨される
    expect(training_rec.target_assessor_id).toBe("assessor_003");
    expect(training_rec.priority_level).toMatch(/high|H|1/i);

    // 改善テーマが特定される
    expect(training_rec).toHaveProperty("improvement_theme");
    expect(training_rec.improvement_theme).toMatch(
      /鉄骨工事|processing_time|deviation/i
    );

    // 9. 見積書の必須項目完全性検証フロー完了を確認
    expect(aggregation_result).toHaveProperty("validation_complete");
    expect(aggregation_result.validation_complete).toBe(true);

    // 10. OCR読取処理へ進める準備が整ったことを確認
    expect(aggregation_result).toHaveProperty("ready_for_ocr_processing");
    expect(aggregation_result.ready_for_ocr_processing).toBe(true);

    // 11. エラーなくすべての必須項目が検出されたことを確認
    expect(aggregation_result).toHaveProperty("required_items_detected");
    const required_items = aggregation_result.required_items_detected;
    expect(required_items.construction_type_present).toBe(true);
    expect(required_items.amount_present).toBe(true);
    expect(required_items.quantity_present).toBe(true);
    expect(required_items.all_items_complete).toBe(true);
  });
});