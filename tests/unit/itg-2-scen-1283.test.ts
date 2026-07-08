import { describe, test, expect } from "@jest/globals";
import {
  classifyMonthlyVariationPattern,
  calculateRequiredStaff,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1283: 月次変動パターン分類・必要人員数算出機能 - 過去12ヶ月の月次件数から月次変動パターンが正確に分類される", () => {
    // ========================================
    // テストデータ準備: 過去12ヶ月の月次件数
    // ========================================
    const monthly_assessment_counts = [
      100, 120, 110, 115, 105, 125, 130, 128, 135, 140, 138, 145,
    ];

    // ========================================
    // 1. 月次変動パターン分類機能の実行
    // ========================================
    const pattern_classification_result = classifyMonthlyVariationPattern({
      monthly_counts: monthly_assessment_counts,
    });

    // ========================================
    // 2. 分類結果が有効なパターンに該当することを確認
    // ========================================
    const valid_patterns = ["stable", "increasing", "decreasing", "fluctuating"];
    expect(valid_patterns).toContain(pattern_classification_result.pattern_type);

    // ========================================
    // 3. 統計指標を用いた分類ロジックの正確性を検証
    // ========================================
    const mean_value = 122.5; // (100+120+110+115+105+125+130+128+135+140+138+145)/12
    const variance =
      ((100 - 122.5) ** 2 +
        (120 - 122.5) ** 2 +
        (110 - 122.5) ** 2 +
        (115 - 122.5) ** 2 +
        (105 - 122.5) ** 2 +
        (125 - 122.5) ** 2 +
        (130 - 122.5) ** 2 +
        (128 - 122.5) ** 2 +
        (135 - 122.5) ** 2 +
        (140 - 122.5) ** 2 +
        (138 - 122.5) ** 2 +
        (145 - 122.5) ** 2) /
      12;
    const standard_deviation = Math.sqrt(variance);
    const coefficient_of_variation = standard_deviation / mean_value;

    expect(pattern_classification_result.standard_deviation).toBeCloseTo(
      standard_deviation,
      2
    );
    expect(pattern_classification_result.coefficient_of_variation).toBeCloseTo(
      coefficient_of_variation,
      4
    );

    // ========================================
    // 4. 分類されたパターンに基づいて必要人員数を算出
    // ========================================
    const required_staff_result = calculateRequiredStaff({
      pattern_type: pattern_classification_result.pattern_type,
      average_monthly_count: mean_value,
      max_monthly_count: Math.max(...monthly_assessment_counts),
      min_monthly_count: Math.min(...monthly_assessment_counts),
      average_processing_time_minutes: 30,
      total_working_minutes_per_day: 480,
      working_days_per_month: 20,
    });

    // ========================================
    // 5. 必要人員数がパターン分類結果と整合性があることを確認
    // ========================================
    expect(required_staff_result.required_staff_count).toBeGreaterThanOrEqual(1);
    expect(required_staff_result.required_staff_count).toBeLessThanOrEqual(50);

    const max_count = Math.max(...monthly_assessment_counts);
    const peak_staffing_count =
      Math.ceil((max_count * 30) / (480 * 20)) + 1;
    expect(required_staff_result.peak_month_required_staff).toBe(
      peak_staffing_count
    );

    // ========================================
    // 6. エッジケース1: 完全に同じ件数が続く場合（安定型）
    // ========================================
    const stable_counts = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const stable_pattern_result = classifyMonthlyVariationPattern({
      monthly_counts: stable_counts,
    });

    expect(stable_pattern_result.pattern_type).toBe("stable");
    expect(stable_pattern_result.standard_deviation).toBe(0);
    expect(stable_pattern_result.coefficient_of_variation).toBe(0);

    const stable_required_staff = calculateRequiredStaff({
      pattern_type: stable_pattern_result.pattern_type,
      average_monthly_count: 100,
      max_monthly_count: 100,
      min_monthly_count: 100,
      average_processing_time_minutes: 30,
      total_working_minutes_per_day: 480,
      working_days_per_month: 20,
    });

    expect(stable_required_staff.required_staff_count).toBe(
      Math.ceil((100 * 30) / (480 * 20)) + 1
    );

    // ========================================
    // 7. エッジケース2: 極端な変動がある場合（変動型）
    // ========================================
    const fluctuating_counts = [50, 150, 60, 160, 55, 155, 65, 165, 70, 170, 75, 180];
    const fluctuating_pattern_result = classifyMonthlyVariationPattern({
      monthly_counts: fluctuating_counts,
    });

    expect(fluctuating_pattern_result.pattern_type).toBe("fluctuating");
    expect(fluctuating_pattern_result.standard_deviation).toBeGreaterThan(40);

    const fluctuating_required_staff = calculateRequiredStaff({
      pattern_type: fluctuating_pattern_result.pattern_type,
      average_monthly_count: 110,
      max_monthly_count: 180,
      min_monthly_count: 50,
      average_processing_time_minutes: 30,
      total_working_minutes_per_day: 480,
      working_days_per_month: 20,
    });

    expect(fluctuating_required_staff.peak_month_required_staff).toBeGreaterThan(
      fluctuating_required_staff.required_staff_count
    );

    // ========================================
    // 8. エッジケース3: 増加型パターン
    // ========================================
    const increasing_counts = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155];
    const increasing_pattern_result = classifyMonthlyVariationPattern({
      monthly_counts: increasing_counts,
    });

    expect(increasing_pattern_result.pattern_type).toBe("increasing");

    // ========================================
    // 9. エッジケース4: 減少型パターン
    // ========================================
    const decreasing_counts = [160, 155, 150, 145, 140, 135, 130, 125, 120, 115, 110, 100];
    const decreasing_pattern_result = classifyMonthlyVariationPattern({
      monthly_counts: decreasing_counts,
    });

    expect(decreasing_pattern_result.pattern_type).toBe("decreasing");

    // ========================================
    // 10. 複数テストケースで一貫性を確認
    // ========================================
    const test_cases = [
      {
        name: "stable",
        counts: [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120],
        expected_pattern: "stable",
      },
      {
        name: "increasing",
        counts: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155],
        expected_pattern: "increasing",
      },
      {
        name: "decreasing",
        counts: [155, 150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100],
        expected_pattern: "decreasing",
      },
      {
        name: "fluctuating",
        counts: [80, 140, 90, 150, 85, 160, 95, 170, 100, 180, 110, 190],
        expected_pattern: "fluctuating",
      },
    ];

    test_cases.forEach((test_case) => {
      const result = classifyMonthlyVariationPattern({
        monthly_counts: test_case.counts,
      });
      expect(result.pattern_type).toBe(test_case.expected_pattern);
      expect(result.standard_deviation).toBeGreaterThanOrEqual(0);
      expect(result.coefficient_of_variation).toBeGreaterThanOrEqual(0);
    });

    // ========================================
    // 11. 必要人員数算出の整合性確認（複数パターン）
    // ========================================
    test_cases.forEach((test_case) => {
      const avg = test_case.counts.reduce((a, b) => a + b, 0) / 12;
      const max_val = Math.max(...test_case.counts);
      const staff_result = calculateRequiredStaff({
        pattern_type: test_case.expected_pattern,
        average_monthly_count: avg,
        max_monthly_count: max_val,
        min_monthly_count: Math.min(...test_case.counts),
        average_processing_time_minutes: 30,
        total_working_minutes_per_day: 480,
        working_days_per_month: 20,
      });

      expect(staff_result.required_staff_count).toBeGreaterThanOrEqual(1);
      expect(staff_result.peak_month_required_staff).toBeGreaterThanOrEqual(
        staff_result.required_staff_count
      );
    });

    // ========================================
    // 12. パターン分類の統計的根拠を再確認
    // ========================================
    const pattern_stats = classifyMonthlyVariationPattern({
      monthly_counts: monthly_assessment_counts,
    });

    expect(pattern_stats).toHaveProperty("pattern_type");
    expect(pattern_stats).toHaveProperty("standard_deviation");
    expect(pattern_stats).toHaveProperty("coefficient_of_variation");
    expect(pattern_stats).toHaveProperty("mean_value");
    expect(pattern_stats).toHaveProperty("max_value");
    expect(pattern_stats).toHaveProperty("min_value");

    expect(pattern_stats.mean_value).toBeCloseTo(122.5, 1);
    expect(pattern_stats.max_value).toBe(145);
    expect(pattern_stats.min_value).toBe(100);
  });
});