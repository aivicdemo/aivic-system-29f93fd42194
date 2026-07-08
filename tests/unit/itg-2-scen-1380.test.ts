import { estimateAdditionalLearningDataRequirements } from "../../src/logic/it-1-br-6-2-1";

describe("他部署適用時の追加学習データ量見積機能", () => {
  // SCEN-1380
  test("精度低下度が許容範囲上限値に達した場合、学習期間と推定コストが正確に計算される", () => {
    // 入力値: 精度低下度を許容範囲上限値（5%）に設定
    const current_ocr_accuracy = 0.85; // 現在のOCR精度 85%
    const target_ocr_accuracy = 0.81; // 目標精度 81% (5% 低下許容)
    const accuracy_degradation_rate = 0.05; // 許容範囲上限値 5%

    const current_learning_data_count = 5000; // 現在の学習データセット件数
    const target_department_complexity = 1.2; // 対象部署の複雑度パラメータ 1.2倍
    const regional_coverage_gap = 0.8; // 地域カバレッジギャップ 0.8 (20%不足)
    const seasonal_variation_factor = 1.1; // 季節変動係数 1.1

    // 計算式:
    // 必要追加学習データ件数 = current_learning_data_count * (1 + accuracy_degradation_rate) * target_department_complexity * (1 + regional_coverage_gap) * seasonal_variation_factor
    // = 5000 * 1.05 * 1.2 * 1.8 * 1.1
    // = 5000 * 1.05 * 1.2 * 1.8 * 1.1 = 12474

    const required_additional_data_count = 12474;

    // 学習期間計算式 (営業日):
    // learning_days = required_additional_data_count / 250 (1営業月 = 20営業日、実装では3ヶ月単位に計算)
    // = 12474 / 250 = 49.896 ≈ 50営業日 ≈ 2.5営業月 ≈ 3ヶ月（切り上げ）

    const estimated_learning_days = Math.ceil(required_additional_data_count / 250);
    // 50営業日 = 10営業週 = 2.5営業月
    // システムは営業月単位（20営業日/月）で計算: 50 / 20 = 2.5月 ≈ 3月（切り上げ）
    const estimated_learning_months = Math.ceil(estimated_learning_days / 20);

    // 推定コスト計算式 (単位: 円):
    // cost = required_additional_data_count * unit_cost_per_record * complexity_multiplier + fixed_system_cost
    // ここで unit_cost_per_record = 500円/件（データ整備費）
    // complexity_multiplier = (1 + accuracy_degradation_rate) = 1.05
    // fixed_system_cost = 100000円（モデル再学習固定費）
    // = 12474 * 500 * 1.05 + 100000
    // = 6237000 + 100000 = 6337000円

    const unit_cost_per_record = 500;
    const fixed_system_cost = 100000;
    const complexity_multiplier = 1 + accuracy_degradation_rate;
    const estimated_cost = required_additional_data_count * unit_cost_per_record * complexity_multiplier + fixed_system_cost;

    // 実行
    const result = estimateAdditionalLearningDataRequirements({
      current_ocr_accuracy,
      target_ocr_accuracy,
      accuracy_degradation_rate,
      current_learning_data_count,
      target_department_complexity,
      regional_coverage_gap,
      seasonal_variation_factor,
    });

    // 検証: 1回目の実行結果
    expect(result.required_additional_data_count).toBe(12474);
    expect(result.estimated_learning_days).toBe(50);
    expect(result.estimated_learning_months).toBe(3);
    expect(result.estimated_cost).toBe(6337000);
    expect(result.accuracy_degradation_rate).toBe(0.05);
    expect(result.feasibility_judgement).toBe("feasible"); // 実行可能と判定

    // 検証: 複数回実行での一貫性確認
    const result_2nd_execution = estimateAdditionalLearningDataRequirements({
      current_ocr_accuracy,
      target_ocr_accuracy,
      accuracy_degradation_rate,
      current_learning_data_count,
      target_department_complexity,
      regional_coverage_gap,
      seasonal_variation_factor,
    });

    expect(result_2nd_execution.required_additional_data_count).toBe(
      result.required_additional_data_count
    );
    expect(result_2nd_execution.estimated_learning_days).toBe(
      result.estimated_learning_days
    );
    expect(result_2nd_execution.estimated_learning_months).toBe(
      result.estimated_learning_months
    );
    expect(result_2nd_execution.estimated_cost).toBe(result.estimated_cost);

    // 検証: 計算式の正確性を定量化
    const expected_formula_days = Math.ceil(12474 / 250);
    const expected_formula_months = Math.ceil(expected_formula_days / 20);
    const expected_formula_cost =
      12474 * 500 * 1.05 + 100000;

    expect(result.estimated_learning_days).toBe(expected_formula_days);
    expect(result.estimated_learning_months).toBe(expected_formula_months);
    expect(result.estimated_cost).toBe(expected_formula_cost);

    // 検証: 精度低下度が許容範囲内であることの確認
    expect(result.accuracy_degradation_rate).toBeLessThanOrEqual(0.05);
    expect(result.estimated_cost).toBeGreaterThan(0);
    expect(result.estimated_learning_days).toBeGreaterThan(0);
  });
});