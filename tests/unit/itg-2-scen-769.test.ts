import { generateStaffAllocationScenarios } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-769: [normal] 人員配置シナリオの複数案自動生成機能 - 過去12ヶ月の変動パターンと現在の査定員平均処理能力から通常期・繁忙期のシナリオが生成される
  test("should generate multiple staff allocation scenarios based on 12-month variation patterns and current assessor average processing capacity", () => {
    // ===== Setup: 過去12ヶ月の査定件数変動データ =====
    // 過去12ヶ月の月別査定件数（件）
    const monthlyAssessmentCounts = [
      120, // 1月
      130, // 2月
      140, // 3月
      150, // 4月
      160, // 5月
      170, // 6月
      165, // 7月
      155, // 8月
      145, // 9月
      135, // 10月
      125, // 11月
      115,  // 12月
    ];

    // 現在の査定員一覧と平均処理能力
    // 各査定員の1日あたりの平均処理件数（件/日）
    const currentAssessors = [
      { assessor_id: "A001", avg_daily_capacity: 8 },
      { assessor_id: "A002", avg_daily_capacity: 9 },
      { assessor_id: "A003", avg_daily_capacity: 7 },
      { assessor_id: "A004", avg_daily_capacity: 8 },
      { assessor_id: "A005", avg_daily_capacity: 10 },
      { assessor_id: "A006", avg_daily_capacity: 8 },
      { assessor_id: "A007", avg_daily_capacity: 9 },
      { assessor_id: "A008", avg_daily_capacity: 8 },
      { assessor_id: "A009", avg_daily_capacity: 7 },
      { assessor_id: "A010", avg_daily_capacity: 8 },
      { assessor_id: "A011", avg_daily_capacity: 9 },
      { assessor_id: "A012", avg_daily_capacity: 8 },
      { assessor_id: "A013", avg_daily_capacity: 8 },
      { assessor_id: "A014", avg_daily_capacity: 7 },
      { assessor_id: "A015", avg_daily_capacity: 9 },
      { assessor_id: "A016", avg_daily_capacity: 8 },
      { assessor_id: "A017", avg_daily_capacity: 8 },
      { assessor_id: "A018", avg_daily_capacity: 9 },
      { assessor_id: "A019", avg_daily_capacity: 8 },
      { assessor_id: "A020", avg_daily_capacity: 8 },
      { assessor_id: "A021", avg_daily_capacity: 7 },
      { assessor_id: "A022", avg_daily_capacity: 8 },
      { assessor_id: "A023", avg_daily_capacity: 9 },
      { assessor_id: "A024", avg_daily_capacity: 8 },
      { assessor_id: "A025", avg_daily_capacity: 8 },
      { assessor_id: "A026", avg_daily_capacity: 8 },
      { assessor_id: "A027", avg_daily_capacity: 7 },
      { assessor_id: "A028", avg_daily_capacity: 8 },
      { assessor_id: "A029", avg_daily_capacity: 9 },
      { assessor_id: "A030", avg_daily_capacity: 8 },
    ];

    // ===== 期待される計算と検証 =====

    // 1. 過去12ヶ月のデータから平均件数、最大件数、最小件数を計算
    const avg_monthly_count = monthlyAssessmentCounts.reduce((a, b) => a + b, 0) / 12; // = 1605 / 12 = 133.75
    const max_monthly_count = Math.max(...monthlyAssessmentCounts); // = 170
    const min_monthly_count = Math.min(...monthlyAssessmentCounts); // = 115

    // 2. 通常期と繁忙期の閾値設定
    // 通常期: 平均 ± 1標準偏差以内
    // 繁忙期: 平均 + 1標準偏差以上
    const variance = monthlyAssessmentCounts.reduce((sum, count) => sum + Math.pow(count - avg_monthly_count, 2), 0) / 12;
    const std_dev = Math.sqrt(variance); // ≈ 19.62

    const normal_period_threshold_min = avg_monthly_count - std_dev; // ≈ 114.13
    const normal_period_threshold_max = avg_monthly_count + std_dev; // ≈ 153.37
    const busy_period_threshold = avg_monthly_count + std_dev; // ≈ 153.37

    // 3. 各月を通常期または繁忙期に分類
    const normal_period_months = monthlyAssessmentCounts.filter(
      (count) => count >= normal_period_threshold_min && count <= normal_period_threshold_max
    ).length;
    // [120, 130, 140, 150, 135, 125, 115] → 7ヶ月が通常期
    const busy_period_months = monthlyAssessmentCounts.filter((count) => count > busy_period_threshold).length;
    // [160, 170, 165, 155, 145] → 5ヶ月が繁忙期

    // 4. 査定員の平均処理能力を計算
    const total_daily_capacity = currentAssessors.reduce((sum, assessor) => sum + assessor.avg_daily_capacity, 0);
    // = 247 件/日
    const avg_assessor_capacity = total_daily_capacity / currentAssessors.length;
    // = 247 / 30 ≈ 8.23 件/日

    // 5. 営業日数を仮定（月間約20営業日）
    const business_days_per_month = 20;

    // 6. 通常期シナリオの必要人員数を計算
    // 通常期の平均月次件数: [120, 130, 140, 150, 135, 125, 115]の平均 ≈ 131.43
    const normal_period_avg_monthly = monthlyAssessmentCounts
      .filter((count) => count >= normal_period_threshold_min && count <= normal_period_threshold_max)
      .reduce((a, b) => a + b, 0) / 7;
    // ≈ 131.43
    const required_capacity_normal = normal_period_avg_monthly;
    const required_assessors_normal = Math.ceil(required_capacity_normal / (avg_assessor_capacity * business_days_per_month));
    // = ceil(131.43 / (8.23 * 20)) = ceil(131.43 / 164.6) ≈ ceil(0.798) = 1
    // 実際には現在の30名で十分なので、推奨人員 = 現在の30名
    const scenario_normal_assessor_count = 30;

    // 7. 繁忙期シナリオの必要人員数を計算
    // 繁忙期の平均月次件数: [160, 170, 165, 155, 145]の平均 = 159
    const busy_period_avg_monthly = monthlyAssessmentCounts
      .filter((count) => count > busy_period_threshold)
      .reduce((a, b) => a + b, 0) / 5;
    // = 159
    const required_capacity_busy = busy_period_avg_monthly;
    const required_assessors_busy = Math.ceil(required_capacity_busy / (avg_assessor_capacity * business_days_per_month));
    // = ceil(159 / (8.23 * 20)) = ceil(159 / 164.6) ≈ ceil(0.967) = 1
    // 実際には30名で対応可能だが、より効率を考慮した配置の提案として以下を検証:
    // 最小案: 30名（現状維持）
    // 標準案: 32名（緩衝人員2名追加）
    // 最適案: 35名（余裕を持った最適配置）

    // ===== 関数呼び出し =====
    const scenarios = generateStaffAllocationScenarios({
      monthly_assessment_counts: monthlyAssessmentCounts,
      current_assessors: currentAssessors,
    });

    // ===== Assertions =====

    // 1. シナリオが複数案生成されたことを確認（最低案、標準案、最適案）
    expect(scenarios.scenarios).toBeDefined();
    expect(Array.isArray(scenarios.scenarios)).toBe(true);
    expect(scenarios.scenarios.length).toBe(3);

    // 2. 各シナリオが必須フィールドを持つことを確認
    scenarios.scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty("scenario_name");
      expect(scenario).toHaveProperty("description");
      expect(scenario).toHaveProperty("total_assessors");
      expect(scenario).toHaveProperty("normal_period_allocation");
      expect(scenario).toHaveProperty("busy_period_allocation");
      expect(scenario).toHaveProperty("expected_processing_capacity_normal");
      expect(scenario).toHaveProperty("expected_processing_capacity_busy");
    });

    // 3. 最小案（minimum）シナリオの検証
    const scenario_minimum = scenarios.scenarios.find((s) => s.scenario_name === "minimum");
    expect(scenario_minimum).toBeDefined();
    expect(scenario_minimum!.total_assessors).toBe(30);
    expect(scenario_minimum!.normal_period_allocation).toBe(30);
    expect(scenario_minimum!.busy_period_allocation).toBe(30);

    // 4. 標準案（standard）シナリオの検証
    const scenario_standard = scenarios.scenarios.find((s) => s.scenario_name === "standard");
    expect(scenario_standard).toBeDefined();
    expect(scenario_standard!.total_assessors).toBe(32);
    expect(scenario_standard!.normal_period_allocation).toBe(30);
    expect(scenario_standard!.busy_period_allocation).toBe(32);

    // 5. 最適案（optimal）シナリオの検証
    const scenario_optimal = scenarios.scenarios.find((s) => s.scenario_name === "optimal");
    expect(scenario_optimal).toBeDefined();
    expect(scenario_optimal!.total_assessors).toBe(35);
    expect(scenario_optimal!.normal_period_allocation).toBe(30);
    expect(scenario_optimal!.busy_period_allocation).toBe(35);

    // 6. 期待処理能力の検証
    // 通常期: 30名 × 8.23件/日 × 20営業日 ≈ 4938件/月
    // 繁忙期（標準案）: 32名 × 8.23件/日 × 20営業日 ≈ 5267件/月
    expect(scenario_minimum!.expected_processing_capacity_normal).toBeCloseTo(4938, 0);
    expect(scenario_standard!.expected_processing_capacity_busy).toBeCloseTo(5267, 0);

    // 7. 過去12ヶ月の変動パターン分析結果の検証
    expect(scenarios.analysis_result).toBeDefined();
    expect(scenarios.analysis_result.normal_period_month_count).toBe(7);
    expect(scenarios.analysis_result.busy_period_month_count).toBe(5);
    expect(scenarios.analysis_result.avg_monthly_assessment_count).toBeCloseTo(133.75, 1);
    expect(scenarios.analysis_result.max_monthly_assessment_count).toBe(170);
    expect(scenarios.analysis_result.min_monthly_assessment_count).toBe(115);

    // 8. 現在の平均処理能力が正しく計算されていることを確認
    expect(scenarios.current_assessor_avg_capacity).toBeCloseTo(8.23, 1);
    expect(scenarios.current_assessor_count).toBe(30);

    // 9. 各シナリオが異なる人員配置を提示していることを確認
    expect(scenario_minimum!.total_assessors).toBeLessThan(scenario_standard!.total_assessors);
    expect(scenario_standard!.total_assessors).toBeLessThan(scenario_optimal!.total_assessors);

    // 10. 各シナリオが期別の適切な配置パターンを反映していることを確認
    // 標準案において、繁忙期の人員が通常期より多いことを確認
    expect(scenario_standard!.busy_period_allocation).toBeGreaterThanOrEqual(scenario_standard!.normal_period_allocation);
    // 最適案において、繁忙期の人員が通常期より多いことを確認
    expect(scenario_optimal!.busy_period_allocation).toBeGreaterThanOrEqual(scenario_optimal!.normal_period_allocation);

    // 11. シナリオの説明文が定義されていることを確認
    expect(scenario_minimum!.description).toBeDefined();
    expect(scenario_minimum!.description.length).toBeGreaterThan(0);
    expect(scenario_standard!.description).toBeDefined();
    expect(scenario_standard!.description.length).toBeGreaterThan(0);
    expect(scenario_optimal!.description).toBeDefined();
    expect(scenario_optimal!.description.length).toBeGreaterThan(0);

    // 12. 通常期と繁忙期が正しく判定されていることを確認
    // 標準案において、通常期は30名、繁忙期は32名であることが妥当
    expect(scenario_standard!.busy_period_allocation - scenario_standard!.normal_period_allocation).toBe(2);
    // 最適案において、通常期は30名、繁忙期は35名であることが妥当
    expect(scenario_optimal!.busy_period_allocation - scenario_optimal!.normal_period_allocation).toBe(5);

    // 13. 期待処理能力が月次件数要件に対応していることを確認
    // 通常期の平均月次件数（≈131.43）に対して、全シナリオで対応可能
    expect(scenario_minimum!.expected_processing_capacity_normal).toBeGreaterThanOrEqual(131.43);
    expect(scenario_standard!.expected_processing_capacity_normal).toBeGreaterThanOrEqual(131.43);
    expect(scenario_optimal!.expected_processing_capacity_normal).toBeGreaterThanOrEqual(131.43);

    // 繁忙期の平均月次件数（159）に対して、全シナリオで対応可能
    expect(scenario_minimum!.expected_processing_capacity_busy).toBeGreaterThanOrEqual(159);
    expect(scenario_standard!.expected_processing_capacity_busy).toBeGreaterThanOrEqual(159);
    expect(scenario_optimal!.expected_processing_capacity_busy).toBeGreaterThanOrEqual(159);

    // 14. シナリオがすべてのシナリオ名を持つことを確認
    const scenario_names = scenarios.scenarios.map((s) => s.scenario_name);
    expect(scenario_names).toContain("minimum");
    expect(scenario_names).toContain("standard");
    expect(scenario_names).toContain("optimal");
  });
});