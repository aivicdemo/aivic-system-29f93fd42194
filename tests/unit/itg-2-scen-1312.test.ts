import { calculateSustainabilityCoefficient } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1312
  test("スケーリング係数と補正係数の自動計算 - 導入効果の持続性係数が月経過とともに段階的に計算される", () => {
    // テストデータ: 導入日が異なる3件の査定品目
    // 導入日を基準として月経過を計算
    const deployment_date = new Date("2024-01-15T00:00:00Z");

    // ケース1: 導入後1ヶ月経過（2024-02-15）
    const assessment_item_1_month = {
      item_id: "ITEM_001",
      deployment_date: deployment_date,
      assessment_date: new Date("2024-02-15T00:00:00Z"),
      initial_sustainability_coefficient: 1.0,
      month_elapsed: 1,
    };

    // ケース2: 導入後3ヶ月経過（2024-04-15）
    const assessment_item_3_months = {
      item_id: "ITEM_002",
      deployment_date: deployment_date,
      assessment_date: new Date("2024-04-15T00:00:00Z"),
      initial_sustainability_coefficient: 1.0,
      month_elapsed: 3,
    };

    // ケース3: 導入後6ヶ月経過（2024-07-15）
    const assessment_item_6_months = {
      item_id: "ITEM_003",
      deployment_date: deployment_date,
      assessment_date: new Date("2024-07-15T00:00:00Z"),
      initial_sustainability_coefficient: 1.0,
      month_elapsed: 6,
    };

    // 月次減衰率: 5%（毎月初期値の5%を減衰）
    const monthly_decay_rate = 0.05;

    // 期待される係数値の計算
    // 1ヶ月経過: 1.0 - (0.05 * 1) = 0.95
    const expected_coefficient_1_month = 1.0 - (monthly_decay_rate * 1);

    // 3ヶ月経過: 1.0 - (0.05 * 3) = 0.85
    const expected_coefficient_3_months = 1.0 - (monthly_decay_rate * 3);

    // 6ヶ月経過: 1.0 - (0.05 * 6) = 0.70
    const expected_coefficient_6_months = 1.0 - (monthly_decay_rate * 6);

    // 持続性係数の自動計算処理を実行
    const actual_coefficient_1_month = calculateSustainabilityCoefficient(
      assessment_item_1_month.initial_sustainability_coefficient,
      assessment_item_1_month.month_elapsed,
      monthly_decay_rate
    );

    const actual_coefficient_3_months = calculateSustainabilityCoefficient(
      assessment_item_3_months.initial_sustainability_coefficient,
      assessment_item_3_months.month_elapsed,
      monthly_decay_rate
    );

    const actual_coefficient_6_months = calculateSustainabilityCoefficient(
      assessment_item_6_months.initial_sustainability_coefficient,
      assessment_item_6_months.month_elapsed,
      monthly_decay_rate
    );

    // 1ヶ月経過した品目の持続性係数が初期値（1.0）に最も近い値で計算されていることを確認
    expect(actual_coefficient_1_month).toBe(expected_coefficient_1_month);
    expect(actual_coefficient_1_month).toBeCloseTo(0.95, 5);

    // 3ヶ月経過した品目の持続性係数が1ヶ月経過時より段階的に低下していることを確認
    expect(actual_coefficient_3_months).toBe(expected_coefficient_3_months);
    expect(actual_coefficient_3_months).toBeLessThan(actual_coefficient_1_month);
    expect(actual_coefficient_3_months).toBeCloseTo(0.85, 5);

    // 6ヶ月経過した品目の持続性係数が3ヶ月経過時よりさらに段階的に低下していることを確認
    expect(actual_coefficient_6_months).toBe(expected_coefficient_6_months);
    expect(actual_coefficient_6_months).toBeLessThan(actual_coefficient_3_months);
    expect(actual_coefficient_6_months).toBeCloseTo(0.7, 5);

    // 各係数の低下率が定義された減衰ルール（月次減衰率）に合致していることを検証
    const decay_1_to_3 = actual_coefficient_1_month - actual_coefficient_3_months;
    const decay_3_to_6 = actual_coefficient_3_months - actual_coefficient_6_months;

    // 1ヶ月から3ヶ月（2ヶ月差）の低下は: 0.05 * 2 = 0.10
    expect(decay_1_to_3).toBeCloseTo(0.1, 5);

    // 3ヶ月から6ヶ月（3ヶ月差）の低下は: 0.05 * 3 = 0.15
    expect(decay_3_to_6).toBeCloseTo(0.15, 5);

    // 係数計算ロジックがmonth_elapsed値を正しく参照して段階的に計算されていることを確認
    const coefficient_calculation_verification = {
      month_1_coefficient: actual_coefficient_1_month,
      month_3_coefficient: actual_coefficient_3_months,
      month_6_coefficient: actual_coefficient_6_months,
      is_decreasing_order:
        actual_coefficient_1_month >
        actual_coefficient_3_months &&
        actual_coefficient_3_months > actual_coefficient_6_months,
    };

    expect(coefficient_calculation_verification.is_decreasing_order).toBe(true);
    expect(coefficient_calculation_verification.month_1_coefficient).toBeCloseTo(
      0.95,
      5
    );
    expect(coefficient_calculation_verification.month_3_coefficient).toBeCloseTo(
      0.85,
      5
    );
    expect(coefficient_calculation_verification.month_6_coefficient).toBeCloseTo(
      0.7,
      5
    );
  });
});