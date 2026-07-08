import { classifyMonthlyBusyLevel } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-944: 月次繁忙度レベル自動分類機能 - 各繁忙度レベルの件数範囲と必要人員数の目安が正確に算出される", () => {
    // テストデータ: 過去12ヶ月分の月次査定件数データ
    const monthly_assessment_counts = [
      { month: "2023-01", count: 45 },
      { month: "2023-02", count: 52 },
      { month: "2023-03", count: 48 },
      { month: "2023-04", count: 61 },
      { month: "2023-05", count: 89 },
      { month: "2023-06", count: 105 },
      { month: "2023-07", count: 118 },
      { month: "2023-08", count: 98 },
      { month: "2023-09", count: 76 },
      { month: "2023-10", count: 64 },
      { month: "2023-11", count: 55 },
      { month: "2023-12", count: 51 },
    ];

    const result = classifyMonthlyBusyLevel(monthly_assessment_counts);

    // 期待結果の計算:
    // 平均件数 = (45+52+48+61+89+105+118+98+76+64+55+51) / 12 = 862 / 12 ≈ 71.83
    // 標準偏差 = √(Σ(x - mean)²/n) を計算
    // 各月の乖離 (x - 71.83)²:
    // (45-71.83)² = 722.24, (52-71.83)² = 393.36, (48-71.83)² = 568.89, (61-71.83)² = 117.36
    // (89-71.83)² = 293.09, (105-71.83)² = 1101.49, (118-71.83)² = 2140.97, (98-71.83)² = 681.49
    // (76-71.83)² = 17.36, (64-71.83)² = 61.36, (55-71.83)² = 283.89, (51-71.83)² = 432.89
    // Σ = 7013.99, 分散 = 7013.99/12 = 584.50, 標準偏差 = √584.50 ≈ 24.17

    // 繁忙度レベル分類基準:
    // 低: mean - 1.5*sd 以下 = 71.83 - 36.25 = 35.58 以下
    // 中: mean - 1.5*sd ～ mean - 0.5*sd = 35.58 ～ 59.66
    // 中高: mean - 0.5*sd ～ mean + 0.5*sd = 59.66 ～ 84.00
    // 高: mean + 0.5*sd ～ mean + 1.5*sd = 84.00 ～ 108.08
    // 極高: mean + 1.5*sd 以上 = 108.08 以上

    expect(result).toEqual({
      average_count: 71.83,
      standard_deviation: 24.17,
      busy_levels: [
        {
          level: "low",
          min_count: 0,
          max_count: 35,
          required_staff: 3,
          sample_months: [],
        },
        {
          level: "medium",
          min_count: 36,
          max_count: 59,
          required_staff: 5,
          sample_months: ["2023-01", "2023-02", "2023-03", "2023-11", "2023-12"],
        },
        {
          level: "medium_high",
          min_count: 60,
          max_count: 84,
          required_staff: 7,
          sample_months: ["2023-04", "2023-09", "2023-10"],
        },
        {
          level: "high",
          min_count: 85,
          max_count: 108,
          required_staff: 9,
          sample_months: ["2023-05", "2023-06", "2023-08"],
        },
        {
          level: "very_high",
          min_count: 109,
          max_count: 999,
          required_staff: 11,
          sample_months: ["2023-07"],
        },
      ],
      classification_criteria: {
        threshold_low_to_medium: 35,
        threshold_medium_to_medium_high: 59,
        threshold_medium_high_to_high: 84,
        threshold_high_to_very_high: 108,
      },
      consistency_score: 98.5,
    });

    // 繁忙度レベルと必要人員数の対応関係が一貫性を持つことを検証
    const required_staff_list = result.busy_levels.map((level) => level.required_staff);
    expect(required_staff_list).toEqual([3, 5, 7, 9, 11]);

    // 必要人員数が単調増加していることを検証
    for (let i = 0; i < required_staff_list.length - 1; i++) {
      expect(required_staff_list[i] < required_staff_list[i + 1]).toBe(true);
    }

    // 各繁忙度レベルの件数範囲が連続かつ重複していないことを検証
    for (let i = 0; i < result.busy_levels.length - 1; i++) {
      const current_max = result.busy_levels[i].max_count;
      const next_min = result.busy_levels[i + 1].min_count;
      expect(current_max + 1).toBe(next_min);
    }

    // 各繁忙度レベルの件数範囲と期待される件数が合致することを検証
    const classifications = {
      low: [],
      medium: [],
      medium_high: [],
      high: [],
      very_high: [],
    };

    monthly_assessment_counts.forEach((item) => {
      if (item.count <= 35) {
        classifications.low.push(item.month);
      } else if (item.count <= 59) {
        classifications.medium.push(item.month);
      } else if (item.count <= 84) {
        classifications.medium_high.push(item.month);
      } else if (item.count <= 108) {
        classifications.high.push(item.month);
      } else {
        classifications.very_high.push(item.month);
      }
    });

    expect(result.busy_levels[0].sample_months).toEqual(classifications.low);
    expect(result.busy_levels[1].sample_months).toEqual(classifications.medium);
    expect(result.busy_levels[2].sample_months).toEqual(
      classifications.medium_high
    );
    expect(result.busy_levels[3].sample_months).toEqual(classifications.high);
    expect(result.busy_levels[4].sample_months).toEqual(
      classifications.very_high
    );

    // 境界値での分類結果が正確であることを検証
    // 例: 件数が35のとき、mediumレベルに分類されるべき
    const count_at_boundary_35 = 35;
    expect(
      result.busy_levels.find((level) => level.level === "medium").max_count
    ).toBe(59);
    expect(
      result.busy_levels.find((level) => level.level === "medium").min_count
    ).toBe(36);
    expect(
      result.busy_levels
        .find((level) => level.level === "low")
        .max_count
    ).toBe(35);

    // 境界値 59 の検証
    const count_at_boundary_59 = 59;
    expect(
      result.busy_levels.find((level) => level.level === "medium_high").min_count
    ).toBe(60);
    expect(
      result.busy_levels.find((level) => level.level === "medium").max_count
    ).toBe(59);

    // 境界値 84 の検証
    const count_at_boundary_84 = 84;
    expect(
      result.busy_levels.find((level) => level.level === "high").min_count
    ).toBe(85);
    expect(
      result.busy_levels.find((level) => level.level === "medium_high").max_count
    ).toBe(84);

    // 境界値 108 の検証
    const count_at_boundary_108 = 108;
    expect(
      result.busy_levels.find((level) => level.level === "very_high").min_count
    ).toBe(109);
    expect(
      result.busy_levels.find((level) => level.level === "high").max_count
    ).toBe(108);

    // 一貫性スコアが十分に高いことを検証 (95以上)
    expect(result.consistency_score).toBeGreaterThanOrEqual(95);

    // 分類基準の値が数学的に妥当であることを検証
    expect(result.classification_criteria.threshold_low_to_medium).toBeLessThan(
      result.classification_criteria.threshold_medium_to_medium_high
    );
    expect(
      result.classification_criteria.threshold_medium_to_medium_high
    ).toBeLessThan(
      result.classification_criteria.threshold_medium_high_to_high
    );
    expect(
      result.classification_criteria.threshold_medium_high_to_high
    ).toBeLessThan(
      result.classification_criteria.threshold_high_to_very_high
    );

    // 各レベルのサンプル月数の合計が12ヶ月であることを検証
    const total_sample_months = result.busy_levels.reduce(
      (sum, level) => sum + level.sample_months.length,
      0
    );
    expect(total_sample_months).toBe(12);

    // 必要人員数が業務的に妥当な値であることを検証
    // 低レベル(3人)から極高(11人)までの増加が段階的であること
    expect(result.busy_levels[0].required_staff).toBe(3);
    expect(result.busy_levels[1].required_staff).toBe(5);
    expect(result.busy_levels[2].required_staff).toBe(7);
    expect(result.busy_levels[3].required_staff).toBe(9);
    expect(result.busy_levels[4].required_staff).toBe(11);
  });
});