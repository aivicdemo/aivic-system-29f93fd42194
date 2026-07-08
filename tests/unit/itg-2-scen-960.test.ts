import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateMultipleStaffingScenarios,
  calculateScenarioFeasibility,
  calculateQualityMaintenance,
  compareScenarioMetrics,
} from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 複数人員配置シナリオの自動生成と評価", () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // SCEN-960
  test("複数人員配置シナリオの実現可能性と品質維持の見通しを算出し、複数パターン間で比較検証できること", () => {
    // ===== 前提条件 =====
    // 査定部署の現在の人員構成：経験者 15 名、新人 15 名（計 30 名）
    // 月次の査定件数：500 件（通常期）、600 件（繁忙期想定）
    // 査定員別の平均処理能力：経験者 20 件/日、新人 12 件/日
    // 処理時間短縮率目標：前月比 10% 削減
    // 品質均一化指標目標：判定ばらつき率 ≤ 5%

    // ===== テストデータ: 複数の人員配置パターン =====
    const baselineMonthlyVolume = 500;
    const peakMonthlyVolume = 600;
    const workingDaysPerMonth = 20;

    // シナリオ 1: 通常配置（応援なし）
    // 現在の 30 名で処理
    // 1 日あたり必要件数 = 500 / 20 = 25 件
    // 利用可能処理能力 = 経験者 15 * 20 + 新人 15 * 12 = 300 + 180 = 480 件/月
    // 繁忙期では 600 / 20 = 30 件/日 が必要 → 需要 600 件 > 供給 480 件
    const scenario1_normal = {
      scenario_id: "SCEN_001",
      name: "通常配置（応援なし）",
      experienced_staff_count: 15,
      junior_staff_count: 15,
      additional_support_count: 0,
      target_monthly_volume: baselineMonthlyVolume,
      processing_capacity_per_day_experienced: 20,
      processing_capacity_per_day_junior: 12,
      quality_variance_threshold: 5,
      time_reduction_target_percent: 10,
      description: "現在の 30 名配置を維持、応援なし",
    };

    // シナリオ 2: 軽度応援（応援 5 名追加、経験者相当）
    // 利用可能処理能力 = (15 + 5) * 20 + 15 * 12 = 400 + 180 = 580 件/月
    const scenario2_light_support = {
      scenario_id: "SCEN_002",
      name: "軽度応援（+5 名）",
      experienced_staff_count: 20,
      junior_staff_count: 15,
      additional_support_count: 5,
      target_monthly_volume: peakMonthlyVolume,
      processing_capacity_per_day_experienced: 20,
      processing_capacity_per_day_junior: 12,
      quality_variance_threshold: 5,
      time_reduction_target_percent: 10,
      description: "経験者相当の応援 5 名追加",
    };

    // シナリオ 3: 重度応援（応援 10 名追加、経験者 5 名 + 新人 5 名）
    // 利用可能処理能力 = (15 + 5) * 20 + (15 + 5) * 12 = 400 + 240 = 640 件/月
    const scenario3_heavy_support = {
      scenario_id: "SCEN_003",
      name: "重度応援（+10 名）",
      experienced_staff_count: 20,
      junior_staff_count: 20,
      additional_support_count: 10,
      target_monthly_volume: peakMonthlyVolume,
      processing_capacity_per_day_experienced: 20,
      processing_capacity_per_day_junior: 12,
      quality_variance_threshold: 5,
      time_reduction_target_percent: 10,
      description: "応援 10 名追加（経験者 5 名、新人 5 名）",
    };

    const scenarios = [scenario1_normal, scenario2_light_support, scenario3_heavy_support];

    // ===== 実行：複数シナリオの自動生成と評価 =====
    const generated_scenarios = generateMultipleStaffingScenarios(scenarios);

    // 期待値：シナリオ数が 3 件返却されること
    expect(generated_scenarios).toHaveLength(3);

    // ===== 実現可能性スコア（Feasibility Score）の算出 =====
    // 計算式：
    // feasibility_score = min(100, (available_capacity / target_volume) * 100)
    // - available_capacity = (経験者数 * 20) + (新人数 * 12)
    // - target_volume = target_monthly_volume

    // シナリオ 1：
    // available_capacity_1 = (15 * 20) + (15 * 12) = 300 + 180 = 480 件/月
    // feasibility_1 = min(100, (480 / 500) * 100) = min(100, 96) = 96
    const feasibility_1 = calculateScenarioFeasibility(scenario1_normal);
    expect(feasibility_1).toBe(96);

    // シナリオ 2：
    // available_capacity_2 = (20 * 20) + (15 * 12) = 400 + 180 = 580 件/月
    // feasibility_2 = min(100, (580 / 600) * 100) = min(100, 96.67) = 96 (小数点切り捨て)
    const feasibility_2 = calculateScenarioFeasibility(scenario2_light_support);
    expect(feasibility_2).toBe(96);

    // シナリオ 3：
    // available_capacity_3 = (20 * 20) + (20 * 12) = 400 + 240 = 640 件/月
    // feasibility_3 = min(100, (640 / 600) * 100) = min(100, 106.67) = 100 (キャップ)
    const feasibility_3 = calculateScenarioFeasibility(scenario3_heavy_support);
    expect(feasibility_3).toBe(100);

    // ===== 品質維持の見通し（Quality Maintenance Score）の算出 =====
    // 計算式：
    // quality_score = max(0, 100 - (additional_support_ratio * 15) - (junior_staff_ratio_increase * 20))
    //   - additional_support_ratio = additional_support_count / baseline_staff_count (30)
    //   - junior_staff_ratio_increase = (junior_staff_count_new - 15) / 15
    //   - 基本考え：応援スタッフと新人スタッフの増加は品質低下リスク

    // シナリオ 1：
    // additional_support_ratio_1 = 0 / 30 = 0
    // junior_increase_1 = (15 - 15) / 15 = 0
    // quality_1 = max(0, 100 - (0 * 15) - (0 * 20)) = 100
    const quality_1 = calculateQualityMaintenance(scenario1_normal);
    expect(quality_1).toBe(100);

    // シナリオ 2：
    // additional_support_ratio_2 = 5 / 30 = 0.1667
    // junior_increase_2 = (15 - 15) / 15 = 0
    // quality_2 = max(0, 100 - (0.1667 * 15) - (0 * 20)) = max(0, 100 - 2.5) = 97 (小数点切り捨て)
    const quality_2 = calculateQualityMaintenance(scenario2_light_support);
    expect(quality_2).toBe(97);

    // シナリオ 3：
    // additional_support_ratio_3 = 10 / 30 = 0.3333
    // junior_increase_3 = (20 - 15) / 15 = 0.3333
    // quality_3 = max(0, 100 - (0.3333 * 15) - (0.3333 * 20))
    //           = max(0, 100 - 5 - 6.67) = max(0, 88.33) = 88 (小数点切り捨て)
    const quality_3 = calculateQualityMaintenance(scenario3_heavy_support);
    expect(quality_3).toBe(88);

    // ===== 複数パターン間の算出結果を比較検証 =====
    // 比較結果オブジェクト：複数シナリオの実現可能性と品質スコアを同一形式で返却
    const comparison_result = compareScenarioMetrics([
      {
        scenario_id: scenario1_normal.scenario_id,
        feasibility_score: feasibility_1,
        quality_score: quality_1,
      },
      {
        scenario_id: scenario2_light_support.scenario_id,
        feasibility_score: feasibility_2,
        quality_score: quality_2,
      },
      {
        scenario_id: scenario3_heavy_support.scenario_id,
        feasibility_score: feasibility_3,
        quality_score: quality_3,
      },
    ]);

    // 期待値：比較結果が配列で返却され、各シナリオの評価指標が含まれること
    expect(comparison_result).toBeDefined();
    expect(Array.isArray(comparison_result)).toBe(true);
    expect(comparison_result.length).toBe(3);

    // 各シナリオの評価指標が 0～100 の範囲内であること
    comparison_result.forEach((result: any) => {
      expect(result.feasibility_score).toBeGreaterThanOrEqual(0);
      expect(result.feasibility_score).toBeLessThanOrEqual(100);
      expect(result.quality_score).toBeGreaterThanOrEqual(0);
      expect(result.quality_score).toBeLessThanOrEqual(100);
    });

    // ===== シナリオ間の相対比較検証 =====
    // 期待：
    // - シナリオ 1 と 2 は実現可能性が同等（96）だが、品質スコアは 1 > 2
    // - シナリオ 3 は実現可能性が最高（100）だが、品質スコアは最低（88）
    // - 複数パターン間で比較可能な形式で出力されていること

    const scenario1_result = comparison_result.find(
      (r: any) => r.scenario_id === "SCEN_001"
    );
    const scenario2_result = comparison_result.find(
      (r: any) => r.scenario_id === "SCEN_002"
    );
    const scenario3_result = comparison_result.find(
      (r: any) => r.scenario_id === "SCEN_003"
    );

    // シナリオ 1 と 2 の実現可能性は同等
    expect(scenario1_result.feasibility_score).toBe(scenario2_result.feasibility_score);

    // シナリオ 1 の品質スコアがシナリオ 2 より高い
    expect(scenario1_result.quality_score).toBeGreaterThan(scenario2_result.quality_score);

    // シナリオ 3 の実現可能性が最高
    expect(scenario3_result.feasibility_score).toBeGreaterThanOrEqual(
      scenario1_result.feasibility_score
    );
    expect(scenario3_result.feasibility_score).toBeGreaterThanOrEqual(
      scenario2_result.feasibility_score
    );

    // シナリオ 3 の品質スコアが最低
    expect(scenario3_result.quality_score).toBeLessThan(scenario1_result.quality_score);
    expect(scenario3_result.quality_score).toBeLessThan(scenario2_result.quality_score);

    // ===== 同一条件での再実行性検証 =====
    // 同じシナリオを再度実行し、同一結果が得られることを確認
    const feasibility_1_retry = calculateScenarioFeasibility(scenario1_normal);
    const quality_1_retry = calculateQualityMaintenance(scenario1_normal);
    const comparison_result_retry = compareScenarioMetrics([
      {
        scenario_id: scenario1_normal.scenario_id,
        feasibility_score: feasibility_1_retry,
        quality_score: quality_1_retry,
      },
    ]);

    expect(feasibility_1_retry).toBe(feasibility_1);
    expect(quality_1_retry).toBe(quality_1);
    expect(comparison_result_retry[0].feasibility_score).toBe(
      comparison_result.find((r: any) => r.scenario_id === "SCEN_001")
        .feasibility_score
    );
    expect(comparison_result_retry[0].quality_score).toBe(
      comparison_result.find((r: any) => r.scenario_id === "SCEN_001").quality_score
    );

    // ===== ログ出力検証 =====
    // 各シナリオの評価指標がログ出力されることを確認
    expect(consoleLogSpy).toHaveBeenCalled();

    // ===== 全体的な検証 =====
    // 全ての人員配置シナリオについて実現可能性スコア（0～100）と品質維持の見通しスコア（0～100）が正常に算出されたこと
    expect(feasibility_1).toBeGreaterThanOrEqual(0);
    expect(feasibility_1).toBeLessThanOrEqual(100);
    expect(feasibility_2).toBeGreaterThanOrEqual(0);
    expect(feasibility_2).toBeLessThanOrEqual(100);
    expect(feasibility_3).toBeGreaterThanOrEqual(0);
    expect(feasibility_3).toBeLessThanOrEqual(100);

    expect(quality_1).toBeGreaterThanOrEqual(0);
    expect(quality_1).toBeLessThanOrEqual(100);
    expect(quality_2).toBeGreaterThanOrEqual(0);
    expect(quality_2).toBeLessThanOrEqual(100);
    expect(quality_3).toBeGreaterThanOrEqual(0);
    expect(quality_3).toBeLessThanOrEqual(100);

    // 複数パターン間で比較可能な形式で出力されていること
    expect(comparison_result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scenario_id: expect.any(String),
          feasibility_score: expect.any(Number),
          quality_score: expect.any(Number),
        }),
      ])
    );
  });
});